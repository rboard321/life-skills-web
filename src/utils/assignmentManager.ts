import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Assignment {
  id: string;
  classId: string;
  unitId: string;
  assignedBy: string;
  assignedAt: Date;
  dueDate?: Date;
  unitTitle: string;
  unitDescription: string;
  isRequired: boolean;
  allowRetakes: boolean;
  completionCount: number;
  totalStudents: number;
}

export interface StudentProgress {
  id: string;
  studentId: string;
  unitId: string;
  classId: string;
  assignmentId?: string;
  completedVideo: boolean;
  completedActivity: boolean;
  completedAt?: Date;
  attemptsCount: number;
  videoProgress?: {
    watchedSeconds: number;
    totalSeconds: number;
    percentWatched: number;
    lastPosition: number;
  };
  activityScore?: number;
  activityData?: any;
  lastUpdated: Date;
}

export class AssignmentManager {
  /**
   * Assigns a unit to a class
   */
  static async assignUnitToClass(
    classId: string,
    unitId: string,
    teacherId: string,
    options: {
      dueDate?: Date;
      isRequired?: boolean;
      allowRetakes?: boolean;
    } = {}
  ): Promise<string> {
    try {
      // Get unit information
      const unitDoc = await getDoc(doc(db, 'units', unitId));
      if (!unitDoc.exists()) {
        throw new Error('Unit not found');
      }
      const unitData = unitDoc.data();

      // Get class information for student count
      const classDoc = await getDoc(doc(db, 'classes', classId));
      if (!classDoc.exists()) {
        throw new Error('Class not found');
      }
      const classData = classDoc.data();

      // Check if unit is already assigned to this class
      const existingAssignment = await this.getClassAssignment(classId, unitId);
      if (existingAssignment) {
        throw new Error('Unit is already assigned to this class');
      }

      // Create assignment document
      const assignmentRef = doc(collection(db, 'assignments'));
      const assignmentData: Assignment = {
        id: assignmentRef.id,
        classId,
        unitId,
        assignedBy: teacherId,
        assignedAt: new Date(),
        dueDate: options.dueDate,
        unitTitle: unitData.title,
        unitDescription: unitData.description,
        isRequired: options.isRequired ?? true,
        allowRetakes: options.allowRetakes ?? true,
        completionCount: 0,
        totalStudents: classData.studentCount || 0,
      };

      await setDoc(assignmentRef, assignmentData);

      console.log(`✅ Assigned unit "${unitData.title}" to class`);
      return assignmentRef.id;
    } catch (error) {
      console.error('Error assigning unit to class:', error);
      throw error;
    }
  }

  /**
   * Gets all assignments for a class
   */
  static async getClassAssignments(classId: string): Promise<Assignment[]> {
    try {
      const assignmentsRef = collection(db, 'assignments');
      const q = query(
        assignmentsRef,
        where('classId', '==', classId),
        orderBy('assignedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        assignedAt: doc.data().assignedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
      })) as Assignment[];
    } catch (error) {
      console.error('Error getting class assignments:', error);
      return [];
    }
  }

  /**
   * Gets assignments for a specific student (based on their enrolled classes)
   */
  static async getStudentAssignments(studentId: string): Promise<Assignment[]> {
    try {
      // First, get all classes the student is enrolled in
      const membersRef = collection(db, 'class_members');
      const memberQuery = query(
        membersRef,
        where('studentId', '==', studentId),
        where('status', '==', 'active')
      );
      const memberSnapshot = await getDocs(memberQuery);

      if (memberSnapshot.empty) {
        return [];
      }

      // Get all class IDs
      const classIds = memberSnapshot.docs.map(doc => doc.data().classId);

      // Get assignments for all enrolled classes
      const assignmentsRef = collection(db, 'assignments');
      const assignmentQuery = query(
        assignmentsRef,
        where('classId', 'in', classIds),
        orderBy('assignedAt', 'desc')
      );
      const assignmentSnapshot = await getDocs(assignmentQuery);

      return assignmentSnapshot.docs.map(doc => ({
        ...doc.data(),
        assignedAt: doc.data().assignedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
      })) as Assignment[];
    } catch (error) {
      console.error('Error getting student assignments:', error);
      return [];
    }
  }

  /**
   * Checks if a unit is already assigned to a class
   */
  static async getClassAssignment(classId: string, unitId: string): Promise<Assignment | null> {
    try {
      const assignmentsRef = collection(db, 'assignments');
      const q = query(
        assignmentsRef,
        where('classId', '==', classId),
        where('unitId', '==', unitId)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        ...doc.data(),
        assignedAt: doc.data().assignedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
      } as Assignment;
    } catch (error) {
      console.error('Error checking class assignment:', error);
      return null;
    }
  }

  /**
   * Removes an assignment from a class
   */
  static async removeAssignment(assignmentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'assignments', assignmentId));
      console.log('✅ Assignment removed successfully');
    } catch (error) {
      console.error('Error removing assignment:', error);
      throw error;
    }
  }

  /**
   * Updates assignment completion statistics
   */
  static async updateAssignmentStats(assignmentId: string): Promise<void> {
    try {
      // Get assignment data
      const assignmentDoc = await getDoc(doc(db, 'assignments', assignmentId));
      if (!assignmentDoc.exists()) {
        throw new Error('Assignment not found');
      }

      const assignment = assignmentDoc.data() as Assignment;

      // Count completed students for this assignment
      const progressRef = collection(db, 'student_progress');
      const progressQuery = query(
        progressRef,
        where('classId', '==', assignment.classId),
        where('unitId', '==', assignment.unitId),
        where('completedVideo', '==', true),
        where('completedActivity', '==', true)
      );
      const progressSnapshot = await getDocs(progressQuery);

      const completionCount = progressSnapshot.size;

      // Update assignment document
      await updateDoc(doc(db, 'assignments', assignmentId), {
        completionCount,
        lastUpdated: new Date()
      });

      console.log(`✅ Updated assignment stats: ${completionCount} completions`);
    } catch (error) {
      console.error('Error updating assignment stats:', error);
    }
  }
}

export class ProgressManager {
  /**
   * Records student progress for a unit
   */
  static async updateStudentProgress(
    studentId: string,
    unitId: string,
    classId: string,
    updates: {
      completedVideo?: boolean;
      completedActivity?: boolean;
      videoProgress?: StudentProgress['videoProgress'];
      activityScore?: number;
      activityData?: any;
      assignmentId?: string;
    }
  ): Promise<void> {
    try {
      // Create a unique ID for this progress record
      const progressId = `${studentId}_${unitId}_${classId}`;
      const progressRef = doc(db, 'student_progress', progressId);

      // Get existing progress or create new
      const existingDoc = await getDoc(progressRef);
      const existingData = existingDoc.exists() ? existingDoc.data() as StudentProgress : null;

      const progressData: StudentProgress = {
        id: progressId,
        studentId,
        unitId,
        classId,
        assignmentId: updates.assignmentId,
        completedVideo: updates.completedVideo ?? existingData?.completedVideo ?? false,
        completedActivity: updates.completedActivity ?? existingData?.completedActivity ?? false,
        attemptsCount: existingData?.attemptsCount ?? 0,
        videoProgress: updates.videoProgress ?? existingData?.videoProgress,
        activityScore: updates.activityScore ?? existingData?.activityScore,
        activityData: updates.activityData ?? existingData?.activityData,
        lastUpdated: new Date(),
      };

      // Update attempts count if activity is being completed
      if (updates.completedActivity && !existingData?.completedActivity) {
        progressData.attemptsCount = (existingData?.attemptsCount ?? 0) + 1;
      }

      // Set completion date if both video and activity are completed
      if (progressData.completedVideo && progressData.completedActivity && !existingData?.completedAt) {
        progressData.completedAt = new Date();
      }

      await setDoc(progressRef, progressData);

      // Update assignment statistics if this was part of an assignment
      if (updates.assignmentId && progressData.completedVideo && progressData.completedActivity) {
        await AssignmentManager.updateAssignmentStats(updates.assignmentId);
      }

      console.log('✅ Student progress updated successfully');
    } catch (error) {
      console.error('Error updating student progress:', error);
      throw error;
    }
  }

  /**
   * Gets all progress for a student across all classes
   */
  static async getStudentProgress(studentId: string): Promise<StudentProgress[]> {
    try {
      const progressRef = collection(db, 'student_progress');
      const q = query(progressRef, where('studentId', '==', studentId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
        lastUpdated: doc.data().lastUpdated?.toDate(),
      })) as StudentProgress[];
    } catch (error) {
      console.error('Error getting student progress:', error);
      return [];
    }
  }

  /**
   * Gets progress for all students in a class for a specific unit
   */
  static async getClassUnitProgress(classId: string, unitId: string): Promise<StudentProgress[]> {
    try {
      const progressRef = collection(db, 'student_progress');
      const q = query(
        progressRef,
        where('classId', '==', classId),
        where('unitId', '==', unitId)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
        lastUpdated: doc.data().lastUpdated?.toDate(),
      })) as StudentProgress[];
    } catch (error) {
      console.error('Error getting class unit progress:', error);
      return [];
    }
  }

  /**
   * Gets a student's progress for a specific unit in a specific class
   */
  static async getStudentUnitProgress(
    studentId: string,
    unitId: string,
    classId: string
  ): Promise<StudentProgress | null> {
    try {
      const progressId = `${studentId}_${unitId}_${classId}`;
      const progressDoc = await getDoc(doc(db, 'student_progress', progressId));

      if (!progressDoc.exists()) {
        return null;
      }

      return {
        ...progressDoc.data(),
        completedAt: progressDoc.data().completedAt?.toDate(),
        lastUpdated: progressDoc.data().lastUpdated?.toDate(),
      } as StudentProgress;
    } catch (error) {
      console.error('Error getting student unit progress:', error);
      return null;
    }
  }
}