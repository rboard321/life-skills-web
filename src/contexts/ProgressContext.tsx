import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import type { UserProgress, UnitProgress } from '../types/progress';

interface ProgressContextType {
  userProgress: UserProgress[];
  isProgressLoading: boolean;
  markVideoCompleted: (unitId: number, watchTime: number, duration: number) => Promise<void>;
  markActivityCompleted: (unitId: number, activityId: number) => Promise<void>;
  getUnitProgress: (unitId: number) => UserProgress | undefined;
  getProgressSummary: () => UnitProgress[];
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
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
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
      const progress = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        startedAt: doc.data().startedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
        lastAccessedAt: doc.data().lastAccessedAt?.toDate() || new Date(),
      })) as UserProgress[];

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

  const saveProgress = async (progress: Partial<UserProgress> & { unitId: number }) => {
    if (!currentUser) return;

    const progressId = `${currentUser.uid}_${progress.unitId}`;
    const progressRef = doc(db, 'userProgress', progressId);

    const existingProgress = await getDoc(progressRef);
    const now = new Date();

    const existingData = existingProgress.data() as Partial<UserProgress> | undefined;

    const updatedProgress: UserProgress = {
      userId: currentUser.uid,
      videoCompleted: false,
      videoWatchTime: 0,
      videoDuration: 0,
      activitiesCompleted: [],
      startedAt: now,
      ...existingData,
      ...progress,
      lastAccessedAt: now,
      unitId: progress.unitId,
    } as UserProgress;

    // Mark as completed if video is done and all activities are completed
    if (updatedProgress.videoCompleted && updatedProgress.activitiesCompleted.length > 0) {
      updatedProgress.completedAt = now;
    }

    await setDoc(progressRef, updatedProgress);
    await refreshProgress();
  };

  const markVideoCompleted = async (unitId: number, watchTime: number, duration: number) => {
    const completionThreshold = 0.9; // 90% watched = completed
    const isCompleted = (watchTime / duration) >= completionThreshold;

    await saveProgress({
      unitId,
      videoCompleted: isCompleted,
      videoWatchTime: Math.max(watchTime, userProgress.find(p => p.unitId === unitId)?.videoWatchTime || 0),
      videoDuration: duration,
    });
  };

  const markActivityCompleted = async (unitId: number, activityId: number) => {
    const existingProgress = getUnitProgress(unitId);
    const completedActivities = existingProgress?.activitiesCompleted || [];

    if (!completedActivities.includes(activityId)) {
      completedActivities.push(activityId);
    }

    await saveProgress({
      unitId,
      activitiesCompleted: completedActivities,
    });
  };

  const getUnitProgress = (unitId: number): UserProgress | undefined => {
    return userProgress.find(p => p.unitId === unitId);
  };

  const getProgressSummary = (): UnitProgress[] => {
    return userProgress.map(progress => ({
      unitId: progress.unitId,
      title: `Unit ${progress.unitId}`,
      status: progress.completedAt ? 'completed' :
               progress.videoCompleted ? 'in-progress' : 'not-started',
      videoProgress: progress.videoDuration > 0 ?
                    Math.round((progress.videoWatchTime / progress.videoDuration) * 100) : 0,
      activitiesCompleted: progress.activitiesCompleted.length,
      totalActivities: 2,
    }));
  };

  const value: ProgressContextType = {
    userProgress,
    isProgressLoading,
    markVideoCompleted,
    markActivityCompleted,
    getUnitProgress,
    getProgressSummary,
    refreshProgress,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
