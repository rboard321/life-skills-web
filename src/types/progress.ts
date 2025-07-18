export interface UserProgress {
  userId: string;
  unitId: number;
  videoCompleted: boolean;
  videoWatchTime: number; // seconds watched
  videoDuration: number; // total video duration
  activitiesCompleted: number[];
  startedAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
}

export interface UnitProgress {
  unitId: number;
  title: string;
  status: 'not-started' | 'in-progress' | 'completed';
  videoProgress: number; // 0-100%
  activitiesCompleted: number;
  totalActivities: number;
}
