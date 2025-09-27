import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Unit } from '../data/sampleUnits';
import { sampleUnits } from '../data/sampleUnits';
import {
  OptimizedProgressTracker,
  UnitsManager,
  MigrationUtils,
  type UserProgressData
} from '../utils/firebase-optimized';

interface UseOptimizedUnitsReturn {
  units: Unit[];
  loading: boolean;
  error: Error | null;
  userProgress: UserProgressData[];
  progressTracker: OptimizedProgressTracker | null;
  updateVideoProgress: (unitId: number, watchedSeconds: number, totalSeconds: number, completed?: boolean) => Promise<void>;
  completeActivity: (unitId: number, attempts?: number) => Promise<void>;
  getProgressStats: () => Promise<{
    totalUnits: number;
    completedUnits: number;
    completedVideos: number;
    completedActivities: number;
    progressPercentage: number;
  } | null>;
  refreshUnits: () => Promise<void>;
}

export const useOptimizedUnits = (assignedOnly: boolean = false): UseOptimizedUnitsReturn => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgressData[]>([]);
  const [progressTracker, setProgressTracker] = useState<OptimizedProgressTracker | null>(null);
  const { currentUser, role } = useAuth();

  // Initialize progress tracker when user is available
  useEffect(() => {
    if (currentUser) {
      const tracker = new OptimizedProgressTracker(currentUser.uid);
      setProgressTracker(tracker);

      // Set up real-time progress listener
      const unsubscribe = tracker.subscribeToProgress((progress) => {
        setUserProgress(progress);
      });

      return unsubscribe;
    } else {
      setProgressTracker(null);
      setUserProgress([]);
    }
  }, [currentUser]);

  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let allUnits: Unit[] = [];

      try {
        // Try to get units from Firebase first
        const firebaseUnits = await UnitsManager.getActiveUnits();

        if (firebaseUnits.length > 0) {
          // Convert OptimizedUnit to Unit format for compatibility
          allUnits = firebaseUnits.map(unit => ({
            id: unit.id,
            title: unit.title,
            description: unit.description,
            videoUrl: unit.videoUrl,
            activityUrl: unit.activityUrl,
            activityType: unit.activityType,
            order: unit.order,
            isActive: unit.isActive,
            createdAt: unit.createdAt,
            updatedAt: unit.updatedAt
          }));
        } else {
          // Fallback to sample data if no units in Firebase
          console.log('No units found in Firebase, using sample data');
          allUnits = [...sampleUnits];
        }
      } catch (firestoreError) {
        console.warn('Firebase unavailable, using sample data:', firestoreError);
        allUnits = [...sampleUnits];
      }

      // Filter units based on user role and assignments
      if (assignedOnly && currentUser && role === 'student') {
        try {
          // Check if user needs migration first
          if (await MigrationUtils.needsMigration(currentUser.uid)) {
            console.log('Migrating user progress from old structure...');
            await MigrationUtils.migrateUserProgress(currentUser.uid);
          }

          // Get assigned units for the user
          const assignedUnits = await UnitsManager.getUserAssignedUnits(currentUser.uid);

          if (assignedUnits.length > 0) {
            allUnits = assignedUnits.map(unit => ({
              id: unit.id,
              title: unit.title,
              description: unit.description,
              videoUrl: unit.videoUrl,
              activityUrl: unit.activityUrl,
              activityType: unit.activityType,
              order: unit.order,
              isActive: unit.isActive,
              createdAt: unit.createdAt,
              updatedAt: unit.updatedAt
            }));
          } else {
            // If no assignments found, show all units (fallback behavior)
            console.log('No assigned units found, showing all active units');
          }
        } catch (userError) {
          console.warn('Could not fetch user assignments, showing all units:', userError);
        }
      }

      // Sort by order
      allUnits.sort((a, b) => a.order - b.order);
      setUnits(allUnits);
    } catch (err) {
      console.error('Failed to fetch units:', err);
      setError(err as Error);
      // Fallback to sample data
      setUnits([...sampleUnits]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, role, assignedOnly]);

  // Fetch units on mount and when dependencies change
  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Wrapper functions for progress tracking
  const updateVideoProgress = useCallback(async (
    unitId: number,
    watchedSeconds: number,
    totalSeconds: number,
    completed: boolean = false
  ) => {
    if (!progressTracker) {
      throw new Error('Progress tracker not initialized');
    }
    await progressTracker.updateVideoProgress(unitId, watchedSeconds, totalSeconds, completed);
  }, [progressTracker]);

  const completeActivity = useCallback(async (unitId: number, attempts: number = 1) => {
    if (!progressTracker) {
      throw new Error('Progress tracker not initialized');
    }
    await progressTracker.completeActivity(unitId, attempts);
  }, [progressTracker]);

  const getProgressStats = useCallback(async () => {
    if (!progressTracker) {
      return null;
    }
    return await progressTracker.getProgressStats();
  }, [progressTracker]);

  const refreshUnits = useCallback(async () => {
    await fetchUnits();
  }, [fetchUnits]);

  return {
    units,
    loading,
    error,
    userProgress,
    progressTracker,
    updateVideoProgress,
    completeActivity,
    getProgressStats,
    refreshUnits
  };
};