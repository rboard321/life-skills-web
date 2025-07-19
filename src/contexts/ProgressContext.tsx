import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import type { UnitProgress, LessonProgress } from '../data/sampleUnits';

interface ProgressContextType {
  userProgress: UnitProgress[];
  isProgressLoading: boolean;
  markLessonVideoCompleted: (unitId: number, lessonId: number, watchTime: number, duration: number) => Promise<void>;
  markLessonActivityCompleted: (unitId: number, lessonId: number, activityId: number) => Promise<void>;
  getUnitProgress: (unitId: number) => UnitProgress | undefined;
  refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [userProgress, setUserProgress] = useState<UnitProgress[]>([]);
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  const refreshProgress = useCallback(async () => {
    if (!currentUser) {
      setUserProgress([]);
      setIsProgressLoading(false);
      return;
    }

    try {
      setIsProgressLoading(true);
      const progressQuery = query(
        collection(db, 'userProgress'),
        where('userId', '==', currentUser.uid)
      );

      const querySnapshot = await getDocs(progressQuery);
      const progress = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          startedAt: data.startedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
          lastAccessedAt: data.lastAccessedAt?.toDate() || new Date(),
          lessonsProgress: Object.entries(data.lessonsProgress || {}).reduce((acc, [lessonId, lessonData]) => {
            const ld = lessonData as {
              startedAt?: { toDate: () => Date };
              completedAt?: { toDate: () => Date };
              lastAccessedAt?: { toDate: () => Date };
              [key: string]: unknown;
            };
            acc[parseInt(lessonId)] = {
              ...ld,
              startedAt: ld.startedAt?.toDate() || new Date(),
              completedAt: ld.completedAt?.toDate(),
              lastAccessedAt: ld.lastAccessedAt?.toDate() || new Date(),
            } as LessonProgress;
            return acc;
          }, {} as Record<number, LessonProgress>)
        } as UnitProgress;
      });

      setUserProgress(progress);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    } finally {
      setIsProgressLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshProgress();
  }, [currentUser, refreshProgress]);

  const saveUnitProgress = async (unitId: number, updatedProgress: Partial<UnitProgress>) => {
    if (!currentUser) return;

    const progressId = `${currentUser.uid}_${unitId}`;
    const progressRef = doc(db, 'userProgress', progressId);

    const existingProgress = await getDoc(progressRef);
    const now = new Date();

    const existingData = existingProgress.data() as Partial<UnitProgress> | undefined;

    const newProgress: UnitProgress = {
      userId: currentUser.uid,
      unitId,
      lessonsProgress: {},
      startedAt: now,
      lastAccessedAt: now,
      overallProgress: {
        lessonsCompleted: 0,
        totalLessons: 0,
        percentComplete: 0
      },
      ...(existingData || {}),
      ...updatedProgress,
    };

    const lessonsProgress = Object.values(newProgress.lessonsProgress);
    const completedLessons = lessonsProgress.filter(l => l.completedAt).length;
    const totalLessons = lessonsProgress.length;

    newProgress.overallProgress = {
      lessonsCompleted: completedLessons,
      totalLessons,
      percentComplete: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    };

    if (completedLessons > 0 && completedLessons === totalLessons) {
      newProgress.completedAt = now;
    }

    await setDoc(progressRef, newProgress);
    await refreshProgress();
  };

  const markLessonVideoCompleted = async (unitId: number, lessonId: number, watchTime: number, duration: number) => {
    const completionThreshold = 0.85;
    const isCompleted = (watchTime / duration) >= completionThreshold;

    const existingUnitProgress = getUnitProgress(unitId);
    const existingLessonProgress = existingUnitProgress?.lessonsProgress[lessonId];

    const now = new Date();
    const updatedLessonProgress: LessonProgress = {
      lessonId,
      videoCompleted: isCompleted,
      videoWatchTime: Math.max(watchTime, existingLessonProgress?.videoWatchTime || 0),
      videoDuration: duration,
      activitiesCompleted: existingLessonProgress?.activitiesCompleted || [],
      startedAt: existingLessonProgress?.startedAt || now,
      lastAccessedAt: now,
      ...(isCompleted && !existingLessonProgress?.completedAt && { completedAt: now })
    };

    if (updatedLessonProgress.videoCompleted && updatedLessonProgress.activitiesCompleted.length > 0) {
      updatedLessonProgress.completedAt = now;
    }

    const updatedLessonsProgress = {
      ...existingUnitProgress?.lessonsProgress,
      [lessonId]: updatedLessonProgress
    };

    await saveUnitProgress(unitId, {
      lessonsProgress: updatedLessonsProgress,
      lastAccessedAt: now
    });
  };

  const markLessonActivityCompleted = async (unitId: number, lessonId: number, activityId: number) => {
    const existingUnitProgress = getUnitProgress(unitId);
    const existingLessonProgress = existingUnitProgress?.lessonsProgress[lessonId];

    if (!existingLessonProgress) {
      console.error('Lesson progress not found');
      return;
    }

    const completedActivities = [...(existingLessonProgress.activitiesCompleted || [])];
    if (!completedActivities.includes(activityId)) {
      completedActivities.push(activityId);
    }

    const now = new Date();
    const updatedLessonProgress: LessonProgress = {
      ...existingLessonProgress,
      activitiesCompleted: completedActivities,
      lastAccessedAt: now
    };

    if (updatedLessonProgress.videoCompleted && completedActivities.length > 0) {
      updatedLessonProgress.completedAt = now;
    }

    const updatedLessonsProgress = {
      ...existingUnitProgress?.lessonsProgress,
      [lessonId]: updatedLessonProgress
    };

    await saveUnitProgress(unitId, {
      lessonsProgress: updatedLessonsProgress,
      lastAccessedAt: now
    });
  };

  const getUnitProgress = (unitId: number): UnitProgress | undefined => {
    return userProgress.find(p => p.unitId === unitId);
  };

  const value: ProgressContextType = {
    userProgress,
    isProgressLoading,
    markLessonVideoCompleted,
    markLessonActivityCompleted,
    getUnitProgress,
    refreshProgress,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
