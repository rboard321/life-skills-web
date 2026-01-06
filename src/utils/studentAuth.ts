import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { findStudentByKidCode } from './kidCodeGenerator';

interface LoginResult {
  success: boolean;
  studentId?: string;
  teacherId?: string;
  displayName?: string;
  kidCode?: string;
  sessionToken?: string;
  error?: string;
}

interface SessionValidationResult {
  valid: boolean;
  studentId?: string;
  teacherId?: string;
  displayName?: string;
  kidCode?: string;
}

export class StudentAuth {
  /**
   * Authenticate student with kid code
   */
  static async loginWithKidCode(kidCode: string): Promise<LoginResult> {
    try {
      // Find student by kid code
      const student = await findStudentByKidCode(kidCode);

      if (!student) {
        return {
          success: false,
          error: 'Invalid kid code. Please check and try again.'
        };
      }

      // Create session
      const sessionToken = await this.createSession(student.id, kidCode, student.teacherId);

      return {
        success: true,
        studentId: student.id,
        teacherId: student.teacherId,
        displayName: student.displayName,
        kidCode: kidCode.toUpperCase(),
        sessionToken
      };
    } catch (error) {
      console.error('Error logging in with kid code:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Create session for student
   */
  static async createSession(studentId: string, kidCode: string, teacherId: string): Promise<string> {
    try {
      const sessionToken = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Delete any existing sessions for this student
      await this.deleteStudentSessions(studentId);

      const sessionData = {
        studentId,
        kidCode: kidCode.toUpperCase(),
        teacherId,
        sessionToken,
        createdAt: now,
        expiresAt,
        lastActivityAt: now
      };

      await addDoc(collection(db, 'student_sessions'), sessionData);

      console.log(`✅ Created session for student ${studentId}`);

      return sessionToken;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Validate session token
   */
  static async validateSession(sessionToken: string): Promise<SessionValidationResult> {
    try {
      const sessionsRef = collection(db, 'student_sessions');
      const q = query(sessionsRef, where('sessionToken', '==', sessionToken));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { valid: false };
      }

      const sessionDoc = querySnapshot.docs[0];
      const sessionData = sessionDoc.data();

      // Check if session is expired
      const expiresAt = sessionData.expiresAt?.toDate();
      if (expiresAt && expiresAt < new Date()) {
        // Session expired - delete it
        await deleteDoc(sessionDoc.ref);
        return { valid: false };
      }

      // Update last activity
      await this.updateLastActivity(sessionToken);

      return {
        valid: true,
        studentId: sessionData.studentId,
        teacherId: sessionData.teacherId,
        kidCode: sessionData.kidCode,
        displayName: sessionData.displayName
      };
    } catch (error) {
      console.error('Error validating session:', error);
      return { valid: false };
    }
  }

  /**
   * Logout student
   */
  static async logout(sessionToken: string): Promise<void> {
    try {
      const sessionsRef = collection(db, 'student_sessions');
      const q = query(sessionsRef, where('sessionToken', '==', sessionToken));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0];
        await deleteDoc(sessionDoc.ref);
        console.log(`✅ Logged out student session`);
      }
    } catch (error) {
      console.error('Error logging out:', error);
      throw new Error('Failed to logout');
    }
  }

  /**
   * Update last activity timestamp
   */
  static async updateLastActivity(sessionToken: string): Promise<void> {
    try {
      const sessionsRef = collection(db, 'student_sessions');
      const q = query(sessionsRef, where('sessionToken', '==', sessionToken));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0];
        await updateDoc(sessionDoc.ref, {
          lastActivityAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating last activity:', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Delete all sessions for a student
   */
  static async deleteStudentSessions(studentId: string): Promise<void> {
    try {
      const sessionsRef = collection(db, 'student_sessions');
      const q = query(sessionsRef, where('studentId', '==', studentId));
      const querySnapshot = await getDocs(q);

      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting student sessions:', error);
      // Don't throw - this is a cleanup operation
    }
  }

  /**
   * Get student info from session token
   */
  static async getStudentFromSession(sessionToken: string): Promise<{ studentId: string; teacherId: string; kidCode: string } | null> {
    try {
      const sessionsRef = collection(db, 'student_sessions');
      const q = query(sessionsRef, where('sessionToken', '==', sessionToken));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const sessionData = querySnapshot.docs[0].data();

      return {
        studentId: sessionData.studentId,
        teacherId: sessionData.teacherId,
        kidCode: sessionData.kidCode
      };
    } catch (error) {
      console.error('Error getting student from session:', error);
      return null;
    }
  }

  /**
   * Clean up expired sessions (can be called periodically)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const sessionsRef = collection(db, 'student_sessions');
      const querySnapshot = await getDocs(sessionsRef);

      const now = new Date();
      const expiredDocs: any[] = [];

      querySnapshot.forEach((doc) => {
        const expiresAt = doc.data().expiresAt?.toDate();
        if (expiresAt && expiresAt < now) {
          expiredDocs.push(doc);
        }
      });

      const deletePromises = expiredDocs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      console.log(`✅ Cleaned up ${expiredDocs.length} expired sessions`);

      return expiredDocs.length;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }
}
