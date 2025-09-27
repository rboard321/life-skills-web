import {
  doc,
  collection,
  writeBatch,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// Optimized data types matching the new structure
export interface OptimizedUnit {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  activityUrl: string;
  activityType: 'h5p' | 'wordwall';
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProgressData {
  unitId: number;
  completedVideo: boolean;
  completedActivity: boolean;
  unlockedActivity: boolean; // New field for 90% threshold
  completedAt?: Date;
  videoProgress?: {
    watchedSeconds: number;
    totalSeconds: number;
    percentWatched: number;
  };
  activityAttempts?: number;
}

export interface OptimizedUser {
  email: string;
  displayName: string;
  role: 'student' | 'teacher';
  assignedUnits: number[];
  classIds: string[];
  createdAt: Date;
  lastActive: Date;
}

export interface ClassData {
  name: string;
  teacherId: string;
  assignedUnits: number[];
  createdAt: Date;
  isActive: boolean;
}

export interface ClassStudent {
  addedAt: Date;
  status: 'active' | 'inactive';
}

// Progress tracking utilities
export class OptimizedProgressTracker {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Update progress using batch operations for better performance
  async updateProgress(unitId: number, updates: Partial<UserProgressData>): Promise<void> {
    const batch = writeBatch(db);
    const progressRef = doc(db, 'users', this.userId, 'progress', unitId.toString());

    const progressData: UserProgressData = {
      unitId,
      completedVideo: false,
      completedActivity: false,
      unlockedActivity: false,
      ...updates,
    };

    // If completing the unit, add timestamp
    if (updates.completedActivity) {
      progressData.completedAt = new Date();
    }

    batch.set(progressRef, progressData, { merge: true });

    // Update user's lastActive timestamp
    const userRef = doc(db, 'users', this.userId);
    batch.update(userRef, { lastActive: new Date() });

    await batch.commit();
  }

  // Update video progress specifically
  async updateVideoProgress(
    unitId: number,
    watchedSeconds: number,
    totalSeconds: number,
    completed: boolean = false
  ): Promise<void> {
    const percentWatched = Math.min(100, (watchedSeconds / totalSeconds) * 100);
    const hasReached90 = percentWatched >= 90 || completed;

    await this.updateProgress(unitId, {
      completedVideo: completed,
      unlockedActivity: hasReached90, // Auto-unlock at 90%
      videoProgress: {
        watchedSeconds,
        totalSeconds,
        percentWatched
      }
    });
  }

  // Mark activity as completed
  async completeActivity(unitId: number, attempts: number = 1): Promise<void> {
    await this.updateProgress(unitId, {
      completedActivity: true,
      activityAttempts: attempts
    });
  }

  // Get user progress for a specific unit
  async getUserProgress(unitId: number): Promise<UserProgressData | null> {
    try {
      const progressRef = doc(db, 'users', this.userId, 'progress', unitId.toString());
      const progressSnap = await getDoc(progressRef);

      if (progressSnap.exists()) {
        return progressSnap.data() as UserProgressData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user progress:', error);
      return null;
    }
  }

  // Get progress for specific unit
  async getUnitProgress(unitId: number): Promise<UserProgressData | null> {
    const progressRef = doc(db, 'users', this.userId, 'progress', unitId.toString());
    const progressDoc = await getDoc(progressRef);

    if (progressDoc.exists()) {
      const data = progressDoc.data();
      return {
        ...data,
        completedAt: data.completedAt?.toDate(),
      } as UserProgressData;
    }

    return null;
  }

  // Listen to progress changes in real-time
  subscribeToProgress(callback: (progress: UserProgressData[]) => void): () => void {
    const progressQuery = query(
      collection(db, 'users', this.userId, 'progress'),
      orderBy('unitId')
    );

    return onSnapshot(progressQuery, (snapshot) => {
      const progress: UserProgressData[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          completedAt: data.completedAt?.toDate(),
        } as UserProgressData;
      });
      callback(progress);
    });
  }

  // Get overall progress statistics
  async getProgressStats(): Promise<{
    totalUnits: number;
    completedUnits: number;
    completedVideos: number;
    completedActivities: number;
    progressPercentage: number;
  }> {
    const progressQuery = query(collection(db, 'users', this.userId, 'progress'));
    const snapshot = await getDocs(progressQuery);

    let completedUnits = 0;
    let completedVideos = 0;
    let completedActivities = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data() as UserProgressData;
      if (data.completedVideo) completedVideos++;
      if (data.completedActivity) completedActivities++;
      if (data.completedVideo && data.completedActivity) completedUnits++;
    });

    const totalUnits = snapshot.size;
    const progressPercentage = totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0;

    return {
      totalUnits,
      completedUnits,
      completedVideos,
      completedActivities,
      progressPercentage
    };
  }
}

// Units management utilities
export class UnitsManager {
  // Get active units with caching-friendly queries
  static async getActiveUnits(): Promise<OptimizedUnit[]> {
    const unitsQuery = query(
      collection(db, 'units'),
      where('isActive', '==', true),
      orderBy('order')
    );

    const snapshot = await getDocs(unitsQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as OptimizedUnit;
    });
  }

  // Create or update unit with batch operation
  static async saveUnit(unit: Omit<OptimizedUnit, 'createdAt' | 'updatedAt'>): Promise<void> {
    const batch = writeBatch(db);
    const unitRef = doc(db, 'units', unit.id.toString());

    const now = new Date();
    const unitData: OptimizedUnit = {
      ...unit,
      updatedAt: now,
      createdAt: now, // This will be ignored if document exists due to merge
    };

    batch.set(unitRef, unitData, { merge: true });
    await batch.commit();
  }

  // Get units assigned to a specific user
  static async getUserAssignedUnits(userId: string): Promise<OptimizedUnit[]> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data() as OptimizedUser;
    const assignedUnitIds = userData.assignedUnits || [];

    if (assignedUnitIds.length === 0) {
      return [];
    }

    // Get assigned units
    const unitsQuery = query(
      collection(db, 'units'),
      where('isActive', '==', true),
      where('id', 'in', assignedUnitIds),
      orderBy('order')
    );

    const snapshot = await getDocs(unitsQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as OptimizedUnit;
    });
  }
}

// User management utilities
export class UserManager {
  // Create or update user with optimized structure
  static async saveUser(userId: string, userData: Partial<OptimizedUser>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const now = new Date();

    const data: Partial<OptimizedUser> = {
      ...userData,
      lastActive: now,
    };

    // Only set createdAt if this is a new user
    const existingDoc = await getDoc(userRef);
    if (!existingDoc.exists()) {
      data.createdAt = now;
    }

    await setDoc(userRef, data, { merge: true });
  }

  // Assign units to user
  static async assignUnitsToUser(userId: string, unitIds: number[]): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      assignedUnits: unitIds,
      lastActive: new Date()
    }, { merge: true });
  }

  // Get user data
  static async getUser(userId: string): Promise<OptimizedUser | null> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        lastActive: data.lastActive?.toDate(),
      } as OptimizedUser;
    }

    return null;
  }
}

// Class management utilities
export class ClassManager {
  // Create new class
  static async createClass(classData: Omit<ClassData, 'createdAt'>): Promise<string> {
    const classRef = doc(collection(db, 'classes'));
    const data: ClassData = {
      ...classData,
      createdAt: new Date(),
    };

    await setDoc(classRef, data);
    return classRef.id;
  }

  // Add student to class
  static async addStudentToClass(classId: string, studentId: string): Promise<void> {
    const studentRef = doc(db, 'classes', classId, 'students', studentId);
    const studentData: ClassStudent = {
      addedAt: new Date(),
      status: 'active'
    };

    await setDoc(studentRef, studentData);
  }

  // Get classes for teacher
  static async getTeacherClasses(teacherId: string): Promise<(ClassData & { id: string })[]> {
    const classesQuery = query(
      collection(db, 'classes'),
      where('teacherId', '==', teacherId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(classesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    } as ClassData & { id: string }));
  }
}

// Migration utilities for transitioning from old structure
export class MigrationUtils {
  // Migrate user progress from old array structure to new subcollection
  static async migrateUserProgress(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const oldProgress = userData.completedUnits || [];

    if (oldProgress.length === 0) return;

    const batch = writeBatch(db);

    // Create new progress documents in subcollection
    oldProgress.forEach((progress: { unitId: number; completedVideo?: boolean; completedActivity?: boolean; completedAt?: Date | { toDate?: () => Date } }) => {
      const progressRef = doc(db, 'users', userId, 'progress', progress.unitId.toString());
      const progressData: UserProgressData = {
        unitId: progress.unitId,
        completedVideo: progress.completedVideo || false,
        completedActivity: progress.completedActivity || false,
        unlockedActivity: progress.completedVideo || false,
        completedAt: progress.completedAt && typeof progress.completedAt === 'object' && 'toDate' in progress.completedAt
          ? progress.completedAt.toDate?.()
          : progress.completedAt instanceof Date
          ? progress.completedAt
          : undefined,
      };

      batch.set(progressRef, progressData);
    });

    // Remove old progress array (but keep other user data)
    batch.update(userRef, {
      completedUnits: null
    });

    await batch.commit();
  }

  // Check if user needs migration
  static async needsMigration(userId: string): Promise<boolean> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return false;

    const userData = userDoc.data();
    return Array.isArray(userData.completedUnits) && userData.completedUnits.length > 0;
  }
}