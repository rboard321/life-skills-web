import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Generates a random 6-character kid code
 * Format: 3 letters + 3 numbers (e.g., "ABC123")
 */
export function generateKidCode(): string {
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
 * Checks if a kid code already exists in the database
 */
export async function isKidCodeTaken(kidCode: string): Promise<boolean> {
  try {
    const studentsRef = collection(db, 'students');
    const q = query(studentsRef, where('kidCode', '==', kidCode), limit(1));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking kid code:', error);
    throw new Error('Failed to verify kid code availability');
  }
}

/**
 * Generates a unique kid code that doesn't exist in the database
 * Tries up to 10 times before failing
 */
export async function generateUniqueKidCode(): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const code = generateKidCode();
    const isTaken = await isKidCodeTaken(code);

    if (!isTaken) {
      return code;
    }

    console.log(`Kid code ${code} is taken, trying again (attempt ${attempt}/${maxAttempts})`);
  }

  throw new Error('Failed to generate unique kid code after maximum attempts');
}

/**
 * Validates a kid code format
 */
export function validateKidCodeFormat(kidCode: string): boolean {
  // Must be exactly 6 characters: 3 letters + 3 numbers
  const pattern = /^[A-Z]{3}[0-9]{3}$/;
  return pattern.test(kidCode.toUpperCase());
}

/**
 * Formats a kid code for display (ensures uppercase)
 */
export function formatKidCode(kidCode: string): string {
  return kidCode.toUpperCase().trim();
}

/**
 * Finds a student by their kid code
 */
export async function findStudentByKidCode(kidCode: string): Promise<{ id: string; displayName: string; teacherId: string } | null> {
  try {
    const studentsRef = collection(db, 'students');
    const q = query(
      studentsRef,
      where('kidCode', '==', kidCode.toUpperCase()),
      where('isActive', '==', true),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const studentData = doc.data();

    return {
      id: doc.id,
      displayName: studentData.displayName,
      teacherId: studentData.teacherId
    };
  } catch (error) {
    console.error('Error finding student by kid code:', error);
    throw new Error('Failed to find student');
  }
}
