
// Simplified Phase 1 Data Model
export type Activity = {
  id: number;
  type: 'h5p' | 'wordwall';
  url: string;
  title: string;
};

// Simplified Unit - direct video + activity, no lessons
export type Unit = {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  activityUrl: string;
  activityType: 'h5p' | 'wordwall';
  order: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

// User progress tracking (legacy - use UserProgressData from firebase-optimized.ts for new implementation)
export type UserProgress = {
  unitId: number;
  completedVideo: boolean;
  completedActivity: boolean;
  completedAt?: Date;
  videoProgress?: {
    watchedSeconds: number;
    totalSeconds: number;
    percentWatched: number;
  };
  activityAttempts?: number;
};

// User model for assignment system
export type User = {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'teacher';
  assignedUnits: number[];
  completedUnits: UserProgress[];
  classIds?: string[];
};

// Class model for teacher management
export type Class = {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  assignedUnits: number[];
  createdAt: Date;
};

// Legacy types for backward compatibility during migration
export type Lesson = {
  id: number;
  title: string;
  description?: string;
  videoUrl: string;
  captionsUrl?: string;
  order: number;
  activities: Activity[];
};

export const sampleUnits: Unit[] = [
  {
    id: 1,
    title: 'Unit 1: Introduction to Life Skills',
    description: 'Learn the basics of essential life skills including communication and daily routines.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    activityUrl: 'https://h5p.org/h5p/embed/27611',
    activityType: 'h5p',
    order: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    title: 'Unit 2: Basic Communication',
    description: 'Master fundamental communication skills for everyday interactions.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    activityUrl: 'https://wordwall.net/embed/b823729c3f42439ebcb5308bbf9e004f?themeId=55&templateId=79&fontStackId=12',
    activityType: 'wordwall',
    order: 2,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 3,
    title: 'Unit 3: Money Management',
    description: 'Learn how to manage money, make change, and understand basic budgeting.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    activityUrl: 'https://h5p.org/h5p/embed/27611',
    activityType: 'h5p',
    order: 3,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 4,
    title: 'Unit 4: Personal Hygiene',
    description: 'Important personal care and hygiene habits for daily life.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    activityUrl: 'https://wordwall.net/embed/b823729c3f42439ebcb5308bbf9e004f?themeId=55&templateId=79&fontStackId=12',
    activityType: 'wordwall',
    order: 4,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 5,
    title: 'Unit 5: Safety at Home',
    description: 'Essential safety practices and emergency procedures for the home.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    activityUrl: 'https://h5p.org/h5p/embed/27611',
    activityType: 'h5p',
    order: 5,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
];


