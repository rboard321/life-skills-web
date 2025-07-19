
export type Activity = {
  id: number;
  type: 'h5p' | 'wordwall';
  url: string;
  title?: string;
};

export type Lesson = {
  id: number;
  title: string;
  description?: string;
  videoUrl: string;
  order: number;
  activities: Activity[];
};

export type Unit = {
  id: number;
  title: string;
  description?: string;
  order: number;
  lessons?: Lesson[];
  totalLessons?: number;
  videoUrl?: string;
  activities?: Activity[];
};

export type LessonProgress = {
  lessonId: number;
  videoCompleted: boolean;
  videoWatchTime: number;
  videoDuration: number;
  activitiesCompleted: number[];
  startedAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
};

export type UnitProgress = {
  userId: string;
  unitId: number;
  lessonsProgress: Record<number, LessonProgress>;
  startedAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
  overallProgress: {
    lessonsCompleted: number;
    totalLessons: number;
    percentComplete: number;
  };
};

export const sampleUnits: Unit[] = [
  {
    id: 1,
    title: 'Unit 1',
    order: 1,
    totalLessons: 1,
    lessons: [
      {
        id: 1,
        title: 'Lesson 1',
        order: 1,
        videoUrl: 'https://www.youtube.com/embed/kInkncJ1fc',
        activities: [
          {
            id: 1,
            type: 'h5p',
            url: 'https://h5p.org/h5p/embed/27611',
            title: 'H5P Activity'
          },
          {
            id: 2,
            type: 'wordwall',
            url: 'https://wordwall.net/embed/e783262c452f445c998fecbb46209b73?themeId=1&templateId=3&fontStackId=0',
            title: 'Wordwall Activity'
          }
        ]
      }
    ]
  },
  ...Array.from({ length: 9 }, (_, i) => ({
    id: i + 2,
    title: `Unit ${i + 2}`,
    order: i + 2,
    totalLessons: 0,
    lessons: []
  }))
];


