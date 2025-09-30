import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Generates a random 6-character teacher code
 * Format: 3 letters + 3 numbers (e.g., "ABC123")
 */
export function generateTeacherCode(): string {
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
 * Checks if a teacher code already exists in the database
 */
export async function isTeacherCodeTaken(teacherCode: string): Promise<boolean> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('teacherCode', '==', teacherCode));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking teacher code:', error);
    throw new Error('Failed to verify teacher code availability');
  }
}

/**
 * Generates a unique teacher code that doesn't exist in the database
 * Tries up to 10 times before failing
 */
export async function generateUniqueTeacherCode(): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const code = generateTeacherCode();
    const isTaken = await isTeacherCodeTaken(code);

    if (!isTaken) {
      return code;
    }

    console.log(`Teacher code ${code} is taken, trying again (attempt ${attempt}/${maxAttempts})`);
  }

  throw new Error('Failed to generate unique teacher code after maximum attempts');
}

/**
 * Assigns a teacher code to a user when they are created/updated as a teacher
 */
export async function assignTeacherCode(userId: string): Promise<string> {
  try {
    const teacherCode = await generateUniqueTeacherCode();

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      teacherCode,
      lastActive: new Date()
    });

    console.log(`✅ Assigned teacher code ${teacherCode} to user ${userId}`);
    return teacherCode;
  } catch (error) {
    console.error('Error assigning teacher code:', error);
    throw new Error('Failed to assign teacher code');
  }
}

/**
 * Validates a teacher code format
 */
export function validateTeacherCodeFormat(teacherCode: string): boolean {
  // Must be exactly 6 characters: 3 letters + 3 numbers
  const pattern = /^[A-Z]{3}[0-9]{3}$/;
  return pattern.test(teacherCode.toUpperCase());
}

/**
 * Formats a teacher code for display (ensures uppercase)
 */
export function formatTeacherCode(teacherCode: string): string {
  return teacherCode.toUpperCase().trim();
}

/**
 * Finds a teacher by their teacher code
 */
export async function findTeacherByCode(teacherCode: string): Promise<{ id: string; name: string } | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('teacherCode', '==', teacherCode.toUpperCase()),
      where('role', '==', 'teacher')
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const userData = doc.data();

    return {
      id: doc.id,
      name: userData.displayName || userData.email
    };
  } catch (error) {
    console.error('Error finding teacher by code:', error);
    throw new Error('Failed to find teacher');
  }
}