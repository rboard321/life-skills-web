import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { generateUniqueKidCode } from './kidCodeGenerator';

export interface Student {
  studentId: string;
  kidCode: string;
  firstName: string;
  lastInitial: string;
  displayName: string;
  teacherId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  notes?: string;
  grade?: string;
}

export class StudentManager {
  /**
   * Create new student account
   */
  static async createStudent(
    firstName: string,
    lastInitial: string,
    teacherId: string,
    options?: {
      grade?: string;
      notes?: string;
    }
  ): Promise<{ studentId: string; kidCode: string }> {
    try {
      // Validate inputs
      if (!firstName || firstName.trim().length === 0) {
        throw new Error('First name is required');
      }
      if (!lastInitial || lastInitial.trim().length !== 1) {
        throw new Error('Last initial must be a single letter');
      }
      if (!/^[A-Za-z]+$/.test(firstName)) {
        throw new Error('First name must contain only letters');
      }
      if (!/^[A-Za-z]$/.test(lastInitial)) {
        throw new Error('Last initial must be a letter');
      }

      // Generate unique kid code
      const kidCode = await generateUniqueKidCode();

      // Format names
      const formattedFirstName = firstName.trim().charAt(0).toUpperCase() + firstName.trim().slice(1).toLowerCase();
      const formattedLastInitial = lastInitial.trim().toUpperCase();
      const displayName = `${formattedFirstName} ${formattedLastInitial}.`;

      const now = new Date();

      const studentData = {
        kidCode,
        firstName: formattedFirstName,
        lastInitial: formattedLastInitial,
        displayName,
        teacherId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
        ...(options?.grade && { grade: options.grade }),
        ...(options?.notes && { notes: options.notes })
      };

      const docRef = await addDoc(collection(db, 'students'), studentData);

      console.log(`✅ Created student ${displayName} with kid code ${kidCode}`);

      return {
        studentId: docRef.id,
        kidCode
      };
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  /**
   * Get all students for a teacher
   */
  static async getTeacherStudents(teacherId: string, includeInactive = false): Promise<Student[]> {
    try {
      const studentsRef = collection(db, 'students');

      let q;
      if (includeInactive) {
        q = query(
          studentsRef,
          where('teacherId', '==', teacherId),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          studentsRef,
          where('teacherId', '==', teacherId),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);

      const students: Student[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        students.push({
          studentId: doc.id,
          kidCode: data.kidCode,
          firstName: data.firstName,
          lastInitial: data.lastInitial,
          displayName: data.displayName,
          teacherId: data.teacherId,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastActiveAt: data.lastActiveAt?.toDate() || new Date(),
          notes: data.notes,
          grade: data.grade
        });
      });

      return students;
    } catch (error) {
      console.error('Error fetching teacher students:', error);
      throw new Error('Failed to fetch students');
    }
  }

  /**
   * Update student info
   */
  static async updateStudent(
    studentId: string,
    updates: Partial<Omit<Student, 'studentId' | 'kidCode' | 'teacherId' | 'createdAt'>>
  ): Promise<void> {
    try {
      // Validate if updating name fields
      if (updates.firstName !== undefined) {
        if (!updates.firstName || updates.firstName.trim().length === 0) {
          throw new Error('First name is required');
        }
        if (!/^[A-Za-z]+$/.test(updates.firstName)) {
          throw new Error('First name must contain only letters');
        }
        updates.firstName = updates.firstName.trim().charAt(0).toUpperCase() + updates.firstName.trim().slice(1).toLowerCase();
      }

      if (updates.lastInitial !== undefined) {
        if (!updates.lastInitial || updates.lastInitial.trim().length !== 1) {
          throw new Error('Last initial must be a single letter');
        }
        if (!/^[A-Za-z]$/.test(updates.lastInitial)) {
          throw new Error('Last initial must be a letter');
        }
        updates.lastInitial = updates.lastInitial.trim().toUpperCase();
      }

      // Update displayName if firstName or lastInitial changed
      const studentRef = doc(db, 'students', studentId);
      const studentDoc = await getDoc(studentRef);

      if (!studentDoc.exists()) {
        throw new Error('Student not found');
      }

      const currentData = studentDoc.data();
      const firstName = updates.firstName || currentData.firstName;
      const lastInitial = updates.lastInitial || currentData.lastInitial;

      const updateData = {
        ...updates,
        displayName: `${firstName} ${lastInitial}.`,
        updatedAt: new Date()
      };

      await updateDoc(studentRef, updateData);

      console.log(`✅ Updated student ${studentId}`);
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  /**
   * Deactivate student (soft delete)
   */
  static async deactivateStudent(studentId: string): Promise<void> {
    try {
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        isActive: false,
        updatedAt: new Date()
      });

      console.log(`✅ Deactivated student ${studentId}`);
    } catch (error) {
      console.error('Error deactivating student:', error);
      throw new Error('Failed to deactivate student');
    }
  }

  /**
   * Reactivate student
   */
  static async reactivateStudent(studentId: string): Promise<void> {
    try {
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        isActive: true,
        updatedAt: new Date()
      });

      console.log(`✅ Reactivated student ${studentId}`);
    } catch (error) {
      console.error('Error reactivating student:', error);
      throw new Error('Failed to reactivate student');
    }
  }

  /**
   * Delete student (hard delete - also deletes all progress and sessions)
   */
  static async deleteStudent(studentId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Delete student document
      const studentRef = doc(db, 'students', studentId);
      batch.delete(studentRef);

      // Delete all progress documents for this student
      const progressRef = collection(db, 'student_progress');
      const progressQuery = query(progressRef, where('studentId', '==', studentId));
      const progressSnapshot = await getDocs(progressQuery);

      progressSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete all sessions for this student
      const sessionsRef = collection(db, 'student_sessions');
      const sessionsQuery = query(sessionsRef, where('studentId', '==', studentId));
      const sessionsSnapshot = await getDocs(sessionsQuery);

      sessionsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`✅ Deleted student ${studentId} and all associated data`);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw new Error('Failed to delete student');
    }
  }

  /**
   * Reset kid code (generate new code)
   */
  static async resetKidCode(studentId: string): Promise<string> {
    try {
      const newKidCode = await generateUniqueKidCode();
      const studentRef = doc(db, 'students', studentId);

      await updateDoc(studentRef, {
        kidCode: newKidCode,
        updatedAt: new Date()
      });

      console.log(`✅ Reset kid code for student ${studentId} to ${newKidCode}`);

      return newKidCode;
    } catch (error) {
      console.error('Error resetting kid code:', error);
      throw new Error('Failed to reset kid code');
    }
  }

  /**
   * Get student by ID
   */
  static async getStudentById(studentId: string): Promise<Student | null> {
    try {
      const studentRef = doc(db, 'students', studentId);
      const studentDoc = await getDoc(studentRef);

      if (!studentDoc.exists()) {
        return null;
      }

      const data = studentDoc.data();
      return {
        studentId: studentDoc.id,
        kidCode: data.kidCode,
        firstName: data.firstName,
        lastInitial: data.lastInitial,
        displayName: data.displayName,
        teacherId: data.teacherId,
        isActive: data.isActive,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastActiveAt: data.lastActiveAt?.toDate() || new Date(),
        notes: data.notes,
        grade: data.grade
      };
    } catch (error) {
      console.error('Error fetching student by ID:', error);
      throw new Error('Failed to fetch student');
    }
  }

  /**
   * Search students by name or kid code
   */
  static async searchStudents(teacherId: string, searchTerm: string): Promise<Student[]> {
    try {
      // Get all students for teacher
      const allStudents = await this.getTeacherStudents(teacherId, false);

      // Filter client-side
      const lowerSearch = searchTerm.toLowerCase();
      return allStudents.filter(student =>
        student.displayName.toLowerCase().includes(lowerSearch) ||
        student.firstName.toLowerCase().includes(lowerSearch) ||
        student.kidCode.toLowerCase().includes(lowerSearch)
      );
    } catch (error) {
      console.error('Error searching students:', error);
      throw new Error('Failed to search students');
    }
  }

  /**
   * Update last active timestamp
   */
  static async updateLastActive(studentId: string): Promise<void> {
    try {
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        lastActiveAt: new Date()
      });
    } catch (error) {
      console.error('Error updating last active:', error);
      // Don't throw - this is a background operation
    }
  }
}
