import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Generates a random 6-character alphanumeric class code
 * Format: 3 letters + 3 numbers (e.g., "ABC123")
 */
export function generateClassCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';

  let code = '';

  // First 3 characters: letters
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Last 3 characters: numbers
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return code;
}

/**
 * Checks if a class code already exists in the database
 */
export async function isClassCodeTaken(classCode: string): Promise<boolean> {
  try {
    const classesRef = collection(db, 'classes');
    const q = query(classesRef, where('classCode', '==', classCode));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking class code:', error);
    throw new Error('Failed to verify class code availability');
  }
}

/**
 * Generates a unique class code that doesn't exist in the database
 * Tries up to 10 times before failing
 */
export async function generateUniqueClassCode(): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const code = generateClassCode();
    const isTaken = await isClassCodeTaken(code);

    if (!isTaken) {
      return code;
    }

    console.log(`Class code ${code} is taken, trying again (attempt ${attempt}/${maxAttempts})`);
  }

  throw new Error('Failed to generate unique class code after maximum attempts');
}

/**
 * Class management utilities
 */
export interface ClassData {
  classCode: string;
  name: string;
  description?: string;
  teacherId: string;
  teacherName: string;
  isActive: boolean;
  allowSelfEnrollment: boolean;
  createdAt: Date;
  updatedAt: Date;
  studentCount: number;
  assignedUnitsCount: number;
}

export class ClassManager {
  /**
   * Creates a new class with a unique class code
   */
  static async createClass(
    teacherId: string,
    teacherName: string,
    className: string,
    description?: string
  ): Promise<{ classId: string; classCode: string }> {
    try {
      // Generate unique class code
      const classCode = await generateUniqueClassCode();

      // Create class document
      const classRef = doc(collection(db, 'classes'));
      const classData: ClassData = {
        classCode,
        name: className,
        description,
        teacherId,
        teacherName,
        isActive: true,
        allowSelfEnrollment: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        studentCount: 0,
        assignedUnitsCount: 0,
      };

      await setDoc(classRef, classData);

      console.log(`✅ Created class "${className}" with code: ${classCode}`);
      return { classId: classRef.id, classCode };
    } catch (error) {
      console.error('Error creating class:', error);
      throw new Error('Failed to create class');
    }
  }

  /**
   * Finds a class by its class code
   */
  static async findClassByCode(classCode: string): Promise<{ id: string; data: ClassData } | null> {
    try {
      const classesRef = collection(db, 'classes');
      const q = query(
        classesRef,
        where('classCode', '==', classCode.toUpperCase()),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        data: doc.data() as ClassData
      };
    } catch (error) {
      console.error('Error finding class by code:', error);
      throw new Error('Failed to find class');
    }
  }

  /**
   * Validates a class code format
   */
  static validateClassCodeFormat(classCode: string): boolean {
    // Must be exactly 6 characters: 3 letters + 3 numbers
    const pattern = /^[A-Z]{3}[0-9]{3}$/;
    return pattern.test(classCode.toUpperCase());
  }

  /**
   * Formats a class code for display (ensures uppercase)
   */
  static formatClassCode(classCode: string): string {
    return classCode.toUpperCase().trim();
  }
}

/**
 * Student enrollment utilities
 */
export interface ClassMemberData {
  classId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  joinedAt: Date;
  status: 'active' | 'inactive';
  lastActive?: Date;
}

export class StudentEnrollment {
  /**
   * Enrolls a student in a class using a class code
   */
  static async enrollStudent(
    classCode: string,
    studentId: string,
    studentName: string,
    studentEmail: string
  ): Promise<{ success: boolean; classInfo?: ClassData; error?: string }> {
    try {
      // Find the class
      const classInfo = await ClassManager.findClassByCode(classCode);

      if (!classInfo) {
        return { success: false, error: 'Class code not found' };
      }

      if (!classInfo.data.allowSelfEnrollment) {
        return { success: false, error: 'This class does not allow self-enrollment' };
      }

      // Check if student is already enrolled
      const isEnrolled = await this.isStudentEnrolled(classInfo.id, studentId);
      if (isEnrolled) {
        return { success: false, error: 'You are already enrolled in this class' };
      }

      // Create enrollment record
      const memberRef = doc(collection(db, 'class_members'));
      const memberData: ClassMemberData = {
        classId: classInfo.id,
        studentId,
        studentName,
        studentEmail,
        joinedAt: new Date(),
        status: 'active',
        lastActive: new Date(),
      };

      await setDoc(memberRef, memberData);

      console.log(`✅ Student ${studentName} enrolled in class ${classInfo.data.name}`);
      return { success: true, classInfo: classInfo.data };
    } catch (error) {
      console.error('Error enrolling student:', error);
      return { success: false, error: 'Failed to join class' };
    }
  }

  /**
   * Checks if a student is already enrolled in a class
   */
  static async isStudentEnrolled(classId: string, studentId: string): Promise<boolean> {
    try {
      const membersRef = collection(db, 'class_members');
      const q = query(
        membersRef,
        where('classId', '==', classId),
        where('studentId', '==', studentId),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(q);

      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
  }

  /**
   * Gets all students in a class (for teachers)
   */
  static async getClassStudents(classId: string): Promise<ClassMemberData[]> {
    try {
      const membersRef = collection(db, 'class_members');
      const q = query(
        membersRef,
        where('classId', '==', classId),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        joinedAt: doc.data().joinedAt?.toDate(),
        lastActive: doc.data().lastActive?.toDate(),
      })) as ClassMemberData[];
    } catch (error) {
      console.error('Error getting class students:', error);
      return [];
    }
  }
}