import React, { createContext, useContext, useEffect, useState } from 'react';
import { StudentAuth } from '../utils/studentAuth';
import { StudentManager } from '../utils/studentManager';

interface StudentAuthContextType {
  studentId: string | null;
  displayName: string | null;
  kidCode: string | null;
  teacherId: string | null;
  sessionToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithKidCode: (kidCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (context === undefined) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return context;
};

const SESSION_STORAGE_KEY = 'student_session_token';

export const StudentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [kidCode, setKidCode] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!studentId && !!sessionToken;

  // Validate session on mount
  useEffect(() => {
    const validateStoredSession = async () => {
      try {
        const storedToken = sessionStorage.getItem(SESSION_STORAGE_KEY);

        if (storedToken) {
          console.log('🔍 Validating stored student session...');
          const validation = await StudentAuth.validateSession(storedToken);

          if (validation.valid && validation.studentId) {
            // Get student details
            const student = await StudentManager.getStudentById(validation.studentId);

            if (student && student.isActive) {
              setStudentId(validation.studentId);
              setTeacherId(validation.teacherId || student.teacherId);
              setKidCode(validation.kidCode || student.kidCode);
              setDisplayName(student.displayName);
              setSessionToken(storedToken);
              console.log('✅ Student session validated:', student.displayName);

              // Update last active
              await StudentManager.updateLastActive(validation.studentId);
            } else {
              // Student not found or inactive
              console.log('❌ Student not found or inactive, clearing session');
              sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
          } else {
            // Invalid or expired session
            console.log('❌ Invalid or expired session, clearing');
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Error validating student session:', error);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    validateStoredSession();
  }, []);

  // Update last activity periodically
  useEffect(() => {
    if (!sessionToken) return;

    const updateActivity = async () => {
      try {
        await StudentAuth.updateLastActivity(sessionToken);
      } catch (error) {
        console.error('Error updating student activity:', error);
      }
    };

    // Update activity every 5 minutes
    const interval = setInterval(updateActivity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [sessionToken]);

  const loginWithKidCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const result = await StudentAuth.loginWithKidCode(code);

      if (result.success && result.studentId && result.sessionToken) {
        setStudentId(result.studentId);
        setTeacherId(result.teacherId || null);
        setDisplayName(result.displayName || null);
        setKidCode(result.kidCode || null);
        setSessionToken(result.sessionToken);

        // Store session token
        sessionStorage.setItem(SESSION_STORAGE_KEY, result.sessionToken);

        // Update last active
        if (result.studentId) {
          await StudentManager.updateLastActive(result.studentId);
        }

        console.log('✅ Student logged in:', result.displayName);

        return { success: true };
      } else {
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (sessionToken) {
        await StudentAuth.logout(sessionToken);
      }

      setStudentId(null);
      setTeacherId(null);
      setDisplayName(null);
      setKidCode(null);
      setSessionToken(null);

      sessionStorage.removeItem(SESSION_STORAGE_KEY);

      console.log('✅ Student logged out');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value: StudentAuthContextType = {
    studentId,
    displayName,
    kidCode,
    teacherId,
    sessionToken,
    loading,
    isAuthenticated,
    loginWithKidCode,
    logout
  };

  return (
    <StudentAuthContext.Provider value={value}>
      {children}
    </StudentAuthContext.Provider>
  );
};
