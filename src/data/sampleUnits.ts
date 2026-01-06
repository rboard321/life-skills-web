// Simplified Phase 1 Data Model
export type ActivityType = 'drag-drop';

export type DragDropPair = {
  id: string;
  item: string;
  target: string;
};

export type DragDropActivity = {
  prompt: string;
  pairs: DragDropPair[];
};

export type Activity = {
  id: number;
  type: ActivityType;
  title: string;
};

// Simplified Unit - direct video + activity, no lessons
export type Unit = {
  id: number | string; // Support both legacy (number) and new (string) formats
  title: string;
  description: string;
  videoUrl: string;
  activityType: ActivityType;
  activityData?: DragDropActivity;
  order: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // Library system fields
  isPrivate?: boolean;        // Private vs Public units
  createdBy?: string;         // Teacher ID who created it
  addedToLibrary?: Date;      // When added to teacher's library
  originalCreator?: string;   // Original creator if copied from global
  docId?: string;            // Firestore document ID for assignments
};

// User progress tracking (legacy - use UserProgressData from firebase-optimized.ts for new implementation)
export type UserProgress = {
  unitId: number;
  activityScorePercent?: number;
  activityAttempts?: number;
  completedAt?: Date;
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
    activityType: 'drag-drop',
    activityData: {
      prompt: 'Match each daily task to the right place.',
      pairs: [
        { id: 'a', item: 'Brush teeth', target: 'Bathroom' },
        { id: 'b', item: 'Wash hands', target: 'Sink' },
        { id: 'c', item: 'Make bed', target: 'Bedroom' }
      ]
    },
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
    activityType: 'drag-drop',
    activityData: {
      prompt: 'Match the phrase to when you would say it.',
      pairs: [
        { id: 'a', item: 'Nice to meet you', target: 'First introduction' },
        { id: 'b', item: 'Excuse me', target: 'Getting attention' },
        { id: 'c', item: 'Thank you', target: 'Showing appreciation' }
      ]
    },
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
    activityType: 'drag-drop',
    activityData: {
      prompt: 'Match each item to the correct cost.',
      pairs: [
        { id: 'a', item: 'Bus ticket', target: '$2' },
        { id: 'b', item: 'Notebook', target: '$3' },
        { id: 'c', item: 'Snack', target: '$1' }
      ]
    },
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
    activityType: 'drag-drop',
    activityData: {
      prompt: 'Match each habit to when it should happen.',
      pairs: [
        { id: 'a', item: 'Shower', target: 'Daily' },
        { id: 'b', item: 'Trim nails', target: 'Weekly' },
        { id: 'c', item: 'Brush teeth', target: 'Morning and night' }
      ]
    },
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
    activityType: 'drag-drop',
    activityData: {
      prompt: 'Match each item to where it should be stored.',
      pairs: [
        { id: 'a', item: 'Cleaning spray', target: 'Locked cabinet' },
        { id: 'b', item: 'First aid kit', target: 'Hall closet' },
        { id: 'c', item: 'Matches', target: 'Out of reach' }
      ]
    },
    order: 5,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
];
