import {
  collection,
  doc as firestoreDoc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

export interface StudentProgress {
  studentId: string;
  unitId: string | number;
  teacherId: string;

  // Activity tracking
  activityStartedAt?: Date;
  activityCompletedAt?: Date;
  activityTimeSeconds: number;
  activityAttempts: number;
  activityScorePercent: number;
  activityCorrectCount: number;
  activityTotalCount: number;
  activityScoreUpdatedAt?: Date;

  // Overall
  isCompleted: boolean;
  totalTimeSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassStatistics {
  totalStudents: number;
  activeStudents: number;
  averageCompletion: number;
  averageScore: number;
  totalLearningTime: number;
  unitsCompleted: number;
}

export interface StudentSummary {
  unitsCompleted: number;
  totalTimeSeconds: number;
  lastActiveAt: Date;
  averageCompletion: number;
}

export class ProgressTracker {
  /**
   * Get progress document ID
   */
  private static getProgressDocId(studentId: string, unitId: string | number): string {
    return `${studentId}_${unitId}`;
  }

  /**
   * Initialize progress record for student + unit
   */
  static async initializeProgress(
    studentId: string,
    unitId: string | number,
    teacherId: string
  ): Promise<void> {
    try {
      const docId = this.getProgressDocId(studentId, unitId);
      const progressRef = firestoreDoc(db, 'student_progress', docId);

      const now = new Date();
      const progressData: any = {
        studentId,
        unitId: String(unitId),
        teacherId,
        activityTimeSeconds: 0,
        activityAttempts: 0,
        activityScorePercent: 0,
        activityCorrectCount: 0,
        activityTotalCount: 0,
        isCompleted: false,
        totalTimeSeconds: 0,
        createdAt: now,
        updatedAt: now
      };

      await setDoc(progressRef, progressData, { merge: true });
      console.log(`✅ Initialized progress for student ${studentId}, unit ${unitId}`);
    } catch (error) {
      console.error('Error initializing progress:', error);
      throw new Error('Failed to initialize progress');
    }
  }

  /**
   * Update activity progress
   */
  static async updateActivityProgress(
    studentId: string,
    unitId: string | number,
    timeSeconds: number,
    activityStartedAt?: Date
  ): Promise<void> {
    try {
      const docId = this.getProgressDocId(studentId, unitId);
      const progressRef = firestoreDoc(db, 'student_progress', docId);

      const totalTimeSeconds = timeSeconds;

      const updateData: any = {
        activityTimeSeconds: timeSeconds,
        totalTimeSeconds,
        updatedAt: new Date()
      };

      if (activityStartedAt) {
        updateData.activityStartedAt = activityStartedAt;
      }

      await setDoc(progressRef, updateData, { merge: true });
    } catch (error) {
      console.error('Error updating activity progress:', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Mark activity as completed
   */
  static async completeActivity(
    studentId: string,
    unitId: string | number,
    score?: {
      percent: number;
      correctCount: number;
      totalCount: number;
      attempts?: number;
    }
  ): Promise<void> {
    try {
      const docId = this.getProgressDocId(studentId, unitId);
      const progressRef = firestoreDoc(db, 'student_progress', docId);

      const updateData: any = {
        activityCompletedAt: new Date(),
        activityAttempts: score?.attempts ?? 1,
        activityScorePercent: score ? Math.round(score.percent) : 0,
        activityCorrectCount: score ? score.correctCount : 0,
        activityTotalCount: score ? score.totalCount : 0,
        activityScoreUpdatedAt: score ? new Date() : undefined,
        isCompleted: true,
        updatedAt: new Date()
      };

      await setDoc(progressRef, updateData, { merge: true });

      console.log(`✅ Activity completed for student ${studentId}, unit ${unitId}`);
    } catch (error) {
      console.error('Error completing activity:', error);
      throw new Error('Failed to complete activity');
    }
  }

  /**
   * Get progress for student + unit
   */
  static async getProgress(
    studentId: string,
    unitId: string | number
  ): Promise<StudentProgress | null> {
    try {
      const docId = this.getProgressDocId(studentId, unitId);
      const progressRef = firestoreDoc(db, 'student_progress', docId);
      const progressDoc = await getDoc(progressRef);

      if (!progressDoc.exists()) {
        return null;
      }

      const data = progressDoc.data();
      return {
        studentId: data.studentId,
        unitId: data.unitId,
        teacherId: data.teacherId,
        activityStartedAt: data.activityStartedAt?.toDate(),
        activityCompletedAt: data.activityCompletedAt?.toDate(),
        activityTimeSeconds: data.activityTimeSeconds || 0,
        activityAttempts: data.activityAttempts || 0,
        activityScorePercent: data.activityScorePercent || 0,
        activityCorrectCount: data.activityCorrectCount || 0,
        activityTotalCount: data.activityTotalCount || 0,
        activityScoreUpdatedAt: data.activityScoreUpdatedAt?.toDate(),
        isCompleted: data.isCompleted || false,
        totalTimeSeconds: data.totalTimeSeconds || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting progress:', error);
      return null;
    }
  }

  /**
   * Get all progress for a student
   */
  static async getStudentProgress(studentId: string, teacherId?: string): Promise<StudentProgress[]> {
    try {
      const progressRef = collection(db, 'student_progress');
      const q = teacherId
        ? query(progressRef, where('studentId', '==', studentId), where('teacherId', '==', teacherId))
        : query(progressRef, where('studentId', '==', studentId));
      const querySnapshot = await getDocs(q);

      const progress: StudentProgress[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        progress.push({
          studentId: data.studentId,
          unitId: data.unitId,
          teacherId: data.teacherId,
          activityStartedAt: data.activityStartedAt?.toDate(),
          activityCompletedAt: data.activityCompletedAt?.toDate(),
          activityTimeSeconds: data.activityTimeSeconds || 0,
          activityAttempts: data.activityAttempts || 0,
          activityScorePercent: data.activityScorePercent || 0,
          activityCorrectCount: data.activityCorrectCount || 0,
          activityTotalCount: data.activityTotalCount || 0,
          activityScoreUpdatedAt: data.activityScoreUpdatedAt?.toDate(),
          isCompleted: data.isCompleted || false,
          totalTimeSeconds: data.totalTimeSeconds || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      return progress;
    } catch (error) {
      console.error('Error getting student progress:', error);
      return [];
    }
  }

  /**
   * Get class statistics
   */
  static async getClassStatistics(teacherId: string): Promise<ClassStatistics> {
    try {
      // Get all students for teacher
      const { StudentManager } = await import('./studentManager');
      const students = await StudentManager.getTeacherStudents(teacherId, false);

      // Get all progress for teacher's students
      const progressRef = collection(db, 'student_progress');
      const q = query(progressRef, where('teacherId', '==', teacherId));
      const querySnapshot = await getDocs(q);

      const allProgress: any[] = [];
      querySnapshot.forEach((doc) => {
        allProgress.push(doc.data());
      });

      // Calculate statistics
      const totalStudents = students.length;
      const activeStudents = students.filter(s => {
        const daysSinceActive = (new Date().getTime() - s.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceActive <= 7;
      }).length;

      const completedUnits = allProgress.filter(p => p.isCompleted).length;
      const totalLearningTime = allProgress.reduce((sum, p) => sum + (p.totalTimeSeconds || 0), 0);
      const averageScore = allProgress.length > 0
        ? allProgress.reduce((sum, p) => sum + (p.activityScorePercent || 0), 0) / allProgress.length
        : 0;

      // Calculate average completion percentage
      const averageCompletion = allProgress.length > 0
        ? (completedUnits / allProgress.length) * 100
        : 0;

      return {
        totalStudents,
        activeStudents,
        averageCompletion: Math.round(averageCompletion),
        averageScore: Math.round(averageScore),
        totalLearningTime,
        unitsCompleted: completedUnits
      };
    } catch (error) {
      console.error('Error getting class statistics:', error);
      return {
        totalStudents: 0,
        activeStudents: 0,
        averageCompletion: 0,
        averageScore: 0,
        totalLearningTime: 0,
        unitsCompleted: 0
      };
    }
  }

  /**
   * Get student summary
   */
  static async getStudentSummary(studentId: string, teacherId?: string): Promise<StudentSummary> {
    try {
      const progress = await this.getStudentProgress(studentId, teacherId);

      const unitsCompleted = progress.filter(p => p.isCompleted).length;
      const totalTimeSeconds = progress.reduce((sum, p) => sum + p.totalTimeSeconds, 0);

      const completedCount = progress.filter(p => p.isCompleted).length;
      const averageCompletion = progress.length > 0
        ? (completedCount / progress.length) * 100
        : 0;

      // Get last active from student record
      const { StudentManager } = await import('./studentManager');
      const student = await StudentManager.getStudentById(studentId);
      const lastActiveAt = student?.lastActiveAt || new Date();

      return {
        unitsCompleted,
        totalTimeSeconds,
        lastActiveAt,
        averageCompletion: Math.round(averageCompletion)
      };
    } catch (error) {
      console.error('Error getting student summary:', error);
      return {
        unitsCompleted: 0,
        totalTimeSeconds: 0,
        lastActiveAt: new Date(),
        averageCompletion: 0
      };
    }
  }
}
