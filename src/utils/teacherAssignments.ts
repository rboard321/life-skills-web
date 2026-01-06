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
import type { ActivityType, DragDropActivity } from '../data/sampleUnits';

export interface TeacherAssignment {
  teacherId: string;
  unitIds: string[];
  teacherName: string;
  updatedAt: Date;
}

export interface Unit {
  id: number | string; // Support both legacy (number) and new (string) formats
  title: string;
  description: string;
  videoUrl: string;
  activityType: ActivityType;
  activityData?: DragDropActivity;
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
   * Assigns units to a teacher
   */
  static async assignUnitsToTeacher(
    teacherId: string,
    unitIds: string[],
    teacherName: string
  ): Promise<void> {
    try {
      const assignmentRef = doc(db, 'teacher_assignments', teacherId);

      const assignmentData: TeacherAssignment = {
        teacherId,
        unitIds,
        teacherName,
        updatedAt: new Date()
      };

      await setDoc(assignmentRef, assignmentData);

      console.log(`✅ Assigned ${unitIds.length} units to teacher ${teacherId}`);
    } catch (error) {
      console.error('Error assigning units to teacher:', error);
      throw new Error('Failed to assign units');
    }
  }

  /**
   * Gets all units assigned to a teacher
   */
  static async getAssignedUnits(teacherId: string): Promise<Unit[]> {
    try {
      const assignmentRef = doc(db, 'teacher_assignments', teacherId);
      const assignmentDoc = await getDoc(assignmentRef);

      if (!assignmentDoc.exists()) {
        return [];
      }

      const assignment = assignmentDoc.data() as TeacherAssignment;

      if (!assignment.unitIds || assignment.unitIds.length === 0) {
        return [];
      }

      const units: Unit[] = [];
      for (const unitId of assignment.unitIds) {
        const unitsQuery = query(
          collection(db, 'units'),
          where('id', '==', parseInt(unitId))
        );

        const querySnapshot = await getDocs(unitsQuery);

        if (!querySnapshot.empty) {
          const unitDoc = querySnapshot.docs[0];
          const unitData = unitDoc.data();
          units.push({
            ...unitData,
            id: unitData.id || unitDoc.id,
            docId: unitDoc.id
          } as unknown as Unit);
        } else {
          const stringQuery = query(
            collection(db, 'units'),
            where('id', '==', unitId)
          );

          const stringSnapshot = await getDocs(stringQuery);
          if (!stringSnapshot.empty) {
            const unitDoc = stringSnapshot.docs[0];
            const unitData = unitDoc.data();
            units.push({
              ...unitData,
              id: unitData.id || unitDoc.id,
              docId: unitDoc.id
            } as unknown as Unit);
          }
        }
      }

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
   * Gets the teacher assignment info for a teacher
   */
  static async getTeacherAssignment(teacherId: string): Promise<TeacherAssignment | null> {
    try {
      const assignmentRef = doc(db, 'teacher_assignments', teacherId);
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
    teacherId: string,
    unitId: string,
    teacherName: string
  ): Promise<void> {
    try {
      const assignmentRef = doc(db, 'teacher_assignments', teacherId);
      const assignmentDoc = await getDoc(assignmentRef);

      let currentUnitIds: string[] = [];

      if (assignmentDoc.exists()) {
        const assignment = assignmentDoc.data() as TeacherAssignment;
        currentUnitIds = assignment.unitIds || [];
      }

      if (!currentUnitIds.includes(unitId)) {
        currentUnitIds.push(unitId);

        await this.assignUnitsToTeacher(teacherId, currentUnitIds, teacherName);
      }
    } catch (error) {
      console.error('Error adding unit to teacher:', error);
      throw new Error('Failed to add unit');
    }
  }

  /**
   * Removes a unit from a teacher's assignments
   */
  static async removeUnitFromTeacher(teacherId: string, unitId: string): Promise<void> {
    try {
      const assignmentRef = doc(db, 'teacher_assignments', teacherId);
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
          id: unitData.id || doc.id,
          docId: doc.id,
          ...unitData
        };
      }) as any[];

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
  static async hasAssignedUnits(teacherId: string): Promise<boolean> {
    try {
      const assignment = await this.getTeacherAssignment(teacherId);
      return assignment !== null && assignment.unitIds.length > 0;
    } catch (error) {
      console.error('Error checking assigned units:', error);
      return false;
    }
  }
}
