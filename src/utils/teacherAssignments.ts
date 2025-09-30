import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export interface TeacherAssignment {
  teacherCode: string;
  unitIds: string[];
  teacherName: string;
  teacherId: string;
  updatedAt: Date;
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  activityUrl: string;
  activityType: 'h5p' | 'wordwall';
  order?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TeacherAssignmentManager {
  /**
   * Assigns units to a teacher's code
   */
  static async assignUnitsToTeacher(
    teacherCode: string,
    unitIds: string[],
    teacherName: string,
    teacherId: string
  ): Promise<void> {
    try {
      const assignmentRef = doc(db, 'teacher_assignments', teacherCode);

      const assignmentData: TeacherAssignment = {
        teacherCode,
        unitIds,
        teacherName,
        teacherId,
        updatedAt: new Date()
      };

      await setDoc(assignmentRef, assignmentData);

      console.log(`✅ Assigned ${unitIds.length} units to teacher code ${teacherCode}`);
    } catch (error) {
      console.error('Error assigning units to teacher:', error);
      throw new Error('Failed to assign units');
    }
  }

  /**
   * Gets all units assigned to a teacher code
   */
  static async getAssignedUnits(teacherCode: string): Promise<Unit[]> {
    try {
      const assignmentRef = doc(db, 'teacher_assignments', teacherCode);
      const assignmentDoc = await getDoc(assignmentRef);

      if (!assignmentDoc.exists()) {
        return [];
      }

      const assignment = assignmentDoc.data() as TeacherAssignment;

      if (!assignment.unitIds || assignment.unitIds.length === 0) {
        return [];
      }

      // Get all assigned units
      const units: Unit[] = [];
      for (const unitId of assignment.unitIds) {
        const unitRef = doc(db, 'units', unitId);
        const unitDoc = await getDoc(unitRef);

        if (unitDoc.exists()) {
          units.push({
            id: unitDoc.id,
            ...unitDoc.data()
          } as Unit);
        }
      }

      // Sort by order if available, otherwise by title
      units.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return a.title.localeCompare(b.title);
      });

      return units;
    } catch (error) {
      console.error('Error getting assigned units:', error);
      return [];
    }
  }

  /**
   * Gets the teacher assignment info for a teacher code
   */
  static async getTeacherAssignment(teacherCode: string): Promise<TeacherAssignment | null> {
    try {
      const assignmentRef = doc(db, 'teacher_assignments', teacherCode);
      const assignmentDoc = await getDoc(assignmentRef);

      if (!assignmentDoc.exists()) {
        return null;
      }

      return {
        ...assignmentDoc.data(),
        updatedAt: assignmentDoc.data().updatedAt?.toDate()
      } as TeacherAssignment;
    } catch (error) {
      console.error('Error getting teacher assignment:', error);
      return null;
    }
  }

  /**
   * Adds a unit to a teacher's assignments
   */
  static async addUnitToTeacher(
    teacherCode: string,
    unitId: string,
    teacherName: string,
    teacherId: string
  ): Promise<void> {
    try {
      const assignmentRef = doc(db, 'teacher_assignments', teacherCode);
      const assignmentDoc = await getDoc(assignmentRef);

      let currentUnitIds: string[] = [];

      if (assignmentDoc.exists()) {
        const assignment = assignmentDoc.data() as TeacherAssignment;
        currentUnitIds = assignment.unitIds || [];
      }

      // Add unit if not already assigned
      if (!currentUnitIds.includes(unitId)) {
        currentUnitIds.push(unitId);

        await this.assignUnitsToTeacher(teacherCode, currentUnitIds, teacherName, teacherId);
        console.log(`✅ Added unit ${unitId} to teacher code ${teacherCode}`);
      }
    } catch (error) {
      console.error('Error adding unit to teacher:', error);
      throw new Error('Failed to add unit');
    }
  }

  /**
   * Removes a unit from a teacher's assignments
   */
  static async removeUnitFromTeacher(teacherCode: string, unitId: string): Promise<void> {
    try {
      const assignmentRef = doc(db, 'teacher_assignments', teacherCode);
      const assignmentDoc = await getDoc(assignmentRef);

      if (!assignmentDoc.exists()) {
        return;
      }

      const assignment = assignmentDoc.data() as TeacherAssignment;
      const currentUnitIds = assignment.unitIds || [];

      const updatedUnitIds = currentUnitIds.filter(id => id !== unitId);

      await updateDoc(assignmentRef, {
        unitIds: updatedUnitIds,
        updatedAt: new Date()
      });

      console.log(`✅ Removed unit ${unitId} from teacher code ${teacherCode}`);
    } catch (error) {
      console.error('Error removing unit from teacher:', error);
      throw new Error('Failed to remove unit');
    }
  }

  /**
   * Gets all available units from the community library
   */
  static async getAllUnits(): Promise<Unit[]> {
    try {
      const unitsRef = collection(db, 'units');
      const unitsSnapshot = await getDocs(unitsRef);

      const units = unitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Unit[];

      // Filter active units and sort by order
      const activeUnits = units.filter(unit => unit.isActive !== false);

      activeUnits.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return a.title.localeCompare(b.title);
      });

      return activeUnits;
    } catch (error) {
      console.error('Error getting all units:', error);
      return [];
    }
  }

  /**
   * Checks if a teacher has any assigned units
   */
  static async hasAssignedUnits(teacherCode: string): Promise<boolean> {
    try {
      const assignment = await this.getTeacherAssignment(teacherCode);
      return assignment !== null && assignment.unitIds.length > 0;
    } catch (error) {
      console.error('Error checking assigned units:', error);
      return false;
    }
  }
}

/**
 * Student access utilities
 */
export class StudentAccess {
  /**
   * Updates a student's assigned teacher code
   */
  static async assignStudentToTeacher(studentId: string, teacherCode: string): Promise<boolean> {
    try {
      // Verify teacher code exists
      const assignment = await TeacherAssignmentManager.getTeacherAssignment(teacherCode);
      if (!assignment) {
        throw new Error('Invalid teacher code');
      }

      // Update student's assigned teacher code
      const userRef = doc(db, 'users', studentId);
      await updateDoc(userRef, {
        assignedTeacherCode: teacherCode,
        lastActive: new Date()
      });

      console.log(`✅ Assigned student ${studentId} to teacher code ${teacherCode}`);
      return true;
    } catch (error) {
      console.error('Error assigning student to teacher:', error);
      return false;
    }
  }

  /**
   * Gets units assigned to a student via their teacher code
   */
  static async getStudentAssignedUnits(studentId: string): Promise<{ units: Unit[]; teacherName?: string }> {
    try {
      // Get student's assigned teacher code
      const userRef = doc(db, 'users', studentId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return { units: [] };
      }

      const userData = userDoc.data();
      const teacherCode = userData.assignedTeacherCode;

      if (!teacherCode) {
        return { units: [] };
      }

      // Get units assigned to that teacher code
      const units = await TeacherAssignmentManager.getAssignedUnits(teacherCode);
      const assignment = await TeacherAssignmentManager.getTeacherAssignment(teacherCode);

      return {
        units,
        teacherName: assignment?.teacherName
      };
    } catch (error) {
      console.error('Error getting student assigned units:', error);
      return { units: [] };
    }
  }

  /**
   * Validates that a teacher code exists and has assigned units
   */
  static async validateTeacherCode(teacherCode: string): Promise<{ valid: boolean; teacherName?: string }> {
    try {
      const assignment = await TeacherAssignmentManager.getTeacherAssignment(teacherCode);

      if (!assignment) {
        return { valid: false };
      }

      return {
        valid: true,
        teacherName: assignment.teacherName
      };
    } catch (error) {
      console.error('Error validating teacher code:', error);
      return { valid: false };
    }
  }
}