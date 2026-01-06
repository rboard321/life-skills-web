import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Unit } from './teacherAssignments';

export interface TeacherLibrary {
  teacherId: string;
  unitIds: string[];
  updatedAt: Date;
}

export interface GlobalLibrary {
  units: string[];
  featured?: string[];
  updatedAt: Date;
}

export interface PaginatedLibraryResult {
  units: Unit[];
  hasMore: boolean;
  lastDocument?: DocumentSnapshot;
}

export class LibraryManager {
  /**
   * Add a unit to a teacher's personal library
   */
  static async addUnitToTeacherLibrary(teacherId: string, unitId: string): Promise<void> {
    try {
      const libraryRef = doc(db, 'teacher_libraries', teacherId);
      const libraryDoc = await getDoc(libraryRef);

      let currentUnitIds: string[] = [];
      if (libraryDoc.exists()) {
        const libraryData = libraryDoc.data() as TeacherLibrary;
        currentUnitIds = libraryData.unitIds || [];
      }

      // Add unit if not already in library
      if (!currentUnitIds.includes(unitId)) {
        currentUnitIds.push(unitId);

        await setDoc(libraryRef, {
          teacherId,
          unitIds: currentUnitIds,
          updatedAt: new Date()
        });

        console.log(`✅ Added unit ${unitId} to teacher ${teacherId}'s library`);
      }
    } catch (error) {
      console.error('Error adding unit to teacher library:', error);
      throw new Error('Failed to add unit to library');
    }
  }

  /**
   * Remove a unit from a teacher's personal library
   */
  static async removeUnitFromTeacherLibrary(teacherId: string, unitId: string): Promise<void> {
    try {
      const libraryRef = doc(db, 'teacher_libraries', teacherId);
      const libraryDoc = await getDoc(libraryRef);

      if (!libraryDoc.exists()) {
        return;
      }

      const libraryData = libraryDoc.data() as TeacherLibrary;
      const currentUnitIds = libraryData.unitIds || [];
      const updatedUnitIds = currentUnitIds.filter(id => id !== unitId);

      await updateDoc(libraryRef, {
        unitIds: updatedUnitIds,
        updatedAt: new Date()
      });

      console.log(`✅ Removed unit ${unitId} from teacher ${teacherId}'s library`);
    } catch (error) {
      console.error('Error removing unit from teacher library:', error);
      throw new Error('Failed to remove unit from library');
    }
  }

  /**
   * Get all units in a teacher's personal library
   */
  static async getTeacherLibrary(teacherId: string): Promise<Unit[]> {
    try {
      const libraryRef = doc(db, 'teacher_libraries', teacherId);
      const libraryDoc = await getDoc(libraryRef);

      if (!libraryDoc.exists()) {
        return [];
      }

      const libraryData = libraryDoc.data() as TeacherLibrary;
      const unitIds = libraryData.unitIds || [];

      // Get all units in the library
      const units: Unit[] = [];
      for (const unitId of unitIds) {
        const unitRef = doc(db, 'units', unitId);
        const unitDoc = await getDoc(unitRef);

        if (unitDoc.exists()) {
          const unitData = unitDoc.data();
          units.push({
            ...unitData,
            id: unitData.id || unitDoc.id,
            docId: unitDoc.id // Include the document ID for assignments
          } as unknown as Unit);
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
      console.error('Error getting teacher library:', error);
      return [];
    }
  }

  /**
   * Get all public units available in the global library (legacy method - no pagination)
   */
  static async getGlobalLibrary(searchTerm?: string): Promise<Unit[]> {
    const result = await this.getGlobalLibraryPaginated(searchTerm, 50);
    return result.units;
  }

  /**
   * Get paginated public units available in the global library
   */
  static async getGlobalLibraryPaginated(
    searchTerm?: string,
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<PaginatedLibraryResult> {
    try {
      // Build query with only one != filter, then filter in code
      let unitsQuery = query(
        collection(db, 'units'),
        orderBy('createdAt', 'desc'),
        limit(pageSize + 1) // Get one extra to check if there are more
      );

      // Add pagination cursor if provided
      if (lastDoc) {
        unitsQuery = query(
          collection(db, 'units'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize + 1)
        );
      }

      const unitsSnapshot = await getDocs(unitsQuery);
      let units = unitsSnapshot.docs.map(doc => {
        const unitData = doc.data();
        return {
          ...unitData,
          id: unitData.id || doc.id,
          docId: doc.id // Include the document ID for assignments
        } as unknown as Unit;
      }).filter(unit => {
        // Filter out private units and inactive units in code
        const isPublic = unit.isPrivate !== true;
        const isActive = unit.isActive !== false;
        return isPublic && isActive;
      });

      // Filter by search term if provided
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        units = units.filter(unit =>
          unit.title.toLowerCase().includes(searchLower) ||
          unit.description.toLowerCase().includes(searchLower)
        );
      }

      // Check if there are more results
      const hasMore = units.length > pageSize;
      if (hasMore) {
        units = units.slice(0, pageSize); // Remove the extra item
      }

      const lastDocument = unitsSnapshot.docs.length > 0 ? unitsSnapshot.docs[Math.min(unitsSnapshot.docs.length - 1, pageSize - 1)] : undefined;

      return {
        units,
        hasMore,
        lastDocument
      };
    } catch (error) {
      console.error('Error getting global library:', error);
      return {
        units: [],
        hasMore: false
      };
    }
  }

  /**
   * Copy a unit from global library to teacher's library
   */
  static async copyUnitToLibrary(unitId: string, teacherId: string): Promise<void> {
    try {
      // First check if unit exists and is public
      const unitRef = doc(db, 'units', unitId);
      const unitDoc = await getDoc(unitRef);

      if (!unitDoc.exists()) {
        throw new Error('Unit not found');
      }

      const unitData = unitDoc.data();
      if (unitData.isPrivate === true) {
        throw new Error('Cannot copy private unit');
      }

      // Add to teacher's library
      await this.addUnitToTeacherLibrary(teacherId, unitId);

      // Update the unit's addedToLibrary timestamp for this teacher
      // Note: This could be enhanced to track per-teacher metadata
      console.log(`✅ Copied unit ${unitId} to teacher ${teacherId}'s library`);
    } catch (error) {
      console.error('Error copying unit to library:', error);
      throw error;
    }
  }

  /**
   * Check if a unit is in a teacher's library
   */
  static async isUnitInTeacherLibrary(teacherId: string, unitId: string): Promise<boolean> {
    try {
      const libraryRef = doc(db, 'teacher_libraries', teacherId);
      const libraryDoc = await getDoc(libraryRef);

      if (!libraryDoc.exists()) {
        return false;
      }

      const libraryData = libraryDoc.data() as TeacherLibrary;
      return (libraryData.unitIds || []).includes(unitId);
    } catch (error) {
      console.error('Error checking unit in teacher library:', error);
      return false;
    }
  }

  /**
   * Get units created by a specific teacher
   */
  static async getUnitsCreatedByTeacher(teacherId: string): Promise<Unit[]> {
    try {
      const unitsQuery = query(
        collection(db, 'units'),
        where('createdBy', '==', teacherId),
        orderBy('createdAt', 'desc')
      );

      const unitsSnapshot = await getDocs(unitsQuery);
      const units = unitsSnapshot.docs.map(doc => {
        const unitData = doc.data();
        return {
          ...unitData,
          id: unitData.id || doc.id,
          docId: doc.id // Include the document ID for assignments
        } as unknown as Unit;
      });

      return units;
    } catch (error) {
      console.error('Error getting units created by teacher:', error);
      return [];
    }
  }

  /**
   * Toggle privacy setting of a unit (only for the creator)
   */
  static async toggleUnitPrivacy(unitId: string, teacherId: string): Promise<void> {
    try {
      const unitRef = doc(db, 'units', unitId);
      const unitDoc = await getDoc(unitRef);

      if (!unitDoc.exists()) {
        throw new Error('Unit not found');
      }

      const unitData = unitDoc.data();
      if (unitData.createdBy !== teacherId) {
        throw new Error('Only the creator can change privacy settings');
      }

      const currentPrivacy = unitData.isPrivate || false;
      await updateDoc(unitRef, {
        isPrivate: !currentPrivacy,
        updatedAt: new Date()
      });

      console.log(`✅ Toggled privacy for unit ${unitId} to ${!currentPrivacy ? 'private' : 'public'}`);
    } catch (error) {
      console.error('Error toggling unit privacy:', error);
      throw error;
    }
  }
}
