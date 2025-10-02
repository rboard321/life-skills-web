import React, { createContext, useContext, useEffect, useState } from 'react';
import type {
  User,
} from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { StudentAccess } from '../utils/teacherAssignments';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  role: string | null;
  teacherCode: string | null;
  assignedTeacherCode: string | null;
  isTeacher: boolean;
  isAdmin: boolean;
  signup: (
    email: string,
    password: string,
    displayName: string,
    role: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithTeacherCode: (email: string, password: string, teacherCode: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [teacherCode, setTeacherCode] = useState<string | null>(null);
  const [assignedTeacherCode, setAssignedTeacherCode] = useState<string | null>(null);

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    userRole: string
  ): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });

      const userData: any = {
        uid: userCredential.user.uid,
        displayName,
        email,
        role: userRole,
        createdAt: new Date(),
        lastActive: new Date()
      };

      // If teacher, generate a teacher code
      if (userRole === 'teacher') {
        // Generate teacher code directly instead of using assignTeacherCode
        const { generateUniqueTeacherCode } = await import('../utils/teacherCodeGenerator');
        const newTeacherCode = await generateUniqueTeacherCode();
        userData.teacherCode = newTeacherCode;
        setTeacherCode(newTeacherCode);
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      setRole(userRole);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithTeacherCode = async (email: string, password: string, teacherCode: string): Promise<void> => {
    // First validate the teacher code
    const validation = await StudentAccess.validateTeacherCode(teacherCode);
    if (!validation.valid) {
      throw new Error('Invalid teacher code');
    }

    // Login the user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Assign the teacher code to the student
    if (userCredential.user) {
      await StudentAccess.assignStudentToTeacher(userCredential.user.uid, teacherCode);
    }
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
  };

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const data = userDoc.data();
          setRole((data?.role as string) || null);
          setTeacherCode((data?.teacherCode as string) || null);
          setAssignedTeacherCode((data?.assignedTeacherCode as string) || null);
        } catch (err) {
          console.error('Failed to fetch user data:', err);
          setRole(null);
          setTeacherCode(null);
          setAssignedTeacherCode(null);
        }
      } else {
        setRole(null);
        setTeacherCode(null);
        setAssignedTeacherCode(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    role,
    teacherCode,
    assignedTeacherCode,
    isTeacher: role === 'teacher',
    isAdmin: role === 'teacher',
    signup,
    login,
    loginWithTeacherCode,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

