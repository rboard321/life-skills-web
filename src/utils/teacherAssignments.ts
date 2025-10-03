import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where
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
  id: number | string; // Support both legacy (number) and new (string) formats
  title: string;
  description: string;
  videoUrl: string;
  activityUrl: string;
  activityType: 'h5p' | 'wordwall';
  order?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // Library system fields
  isPrivate?: boolean;        // Private vs Public units
  createdBy?: string;         // Teacher ID who created it
  addedToLibrary?: Date;      // When added to teacher's library
  originalCreator?: string;   // Original creator if copied from global
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
      console.log('🔍 getAssignedUnits called with teacher code:', teacherCode);
      const assignmentRef = doc(db, 'teacher_assignments', teacherCode);
      const assignmentDoc = await getDoc(assignmentRef);

      if (!assignmentDoc.exists()) {
        console.log('🔍 Assignment document not found for teacher code:', teacherCode);
        return [];
      }

      const assignment = assignmentDoc.data() as TeacherAssignment;
      console.log('🔍 Assignment data:', assignment);

      if (!assignment.unitIds || assignment.unitIds.length === 0) {
        console.log('🔍 No unit IDs assigned to teacher code:', teacherCode);
        return [];
      }

      console.log('🔍 Unit IDs assigned:', assignment.unitIds);

      // Get all assigned units by querying for units with matching internal id
      const units: Unit[] = [];
      for (const unitId of assignment.unitIds) {
        console.log('🔍 Querying for unit with internal ID:', unitId);

        // Query units collection for unit with matching internal id field
        const unitsQuery = query(
          collection(db, 'units'),
          where('id', '==', parseInt(unitId)) // Convert to number since unit.id can be number
        );

        const querySnapshot = await getDocs(unitsQuery);

        if (!querySnapshot.empty) {
          // Should only be one matching unit
          const unitDoc = querySnapshot.docs[0];
          console.log('🔍 Unit found via query:', unitDoc.id, unitDoc.data());
          const unitData = unitDoc.data();
          units.push({
            ...unitData,
            id: unitData.id || unitDoc.id,
            docId: unitDoc.id // Include document ID for assignments
          } as unknown as Unit);
        } else {
          console.log('🔍 Unit NOT found for internal ID:', unitId);

          // Also try querying with string version in case it's stored as string
          const stringQuery = query(
            collection(db, 'units'),
            where('id', '==', unitId)
          );

          const stringSnapshot = await getDocs(stringQuery);
          if (!stringSnapshot.empty) {
            const unitDoc = stringSnapshot.docs[0];
            console.log('🔍 Unit found via string query:', unitDoc.id, unitDoc.data());
            const unitData = unitDoc.data();
            units.push({
              ...unitData,
              id: unitData.id || unitDoc.id,
              docId: unitDoc.id // Include document ID for assignments
            } as unknown as Unit);
          } else {
            console.log('🔍 Unit NOT found with either number or string ID:', unitId);
          }
        }
      }

      console.log('🔍 Final units array:', units);

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
  static async getAllUnits(): Promise<any[]> {
    try {
      const unitsRef = collection(db, 'units');
      const unitsSnapshot = await getDocs(unitsRef);

      const units = unitsSnapshot.docs.map(doc => {
        const unitData = doc.data();
        return {
          id: unitData.id || doc.id, // Use data.id if available, fallback to doc.id
          docId: doc.id, // Always include the actual document ID
          ...unitData
        };
      }) as any[];

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
   * Validates that a teacher code exists
   */
  static async validateTeacherCode(teacherCode: string): Promise<{ valid: boolean; teacherName?: string }> {
    try {
      // Check if teacher code exists in teacher_assignments collection
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