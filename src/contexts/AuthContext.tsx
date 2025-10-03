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
    try {
      console.log('🔍 Starting signup process for:', email, 'with role:', userRole);

      // Set flag to prevent race condition during signup
      sessionStorage.setItem('signupInProgress', 'true');

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        console.log('🔍 User created successfully:', userCredential.user.uid);
        await updateProfile(userCredential.user, { displayName });

        const userData: any = {
          uid: userCredential.user.uid,
          displayName,
          email,
          role: userRole,
          createdAt: new Date(),
          lastActive: new Date()
        };

        // If teacher, generate a teacher code and create assignment document
        if (userRole === 'teacher') {
          console.log('🔍 Creating teacher account with teacher code...');
          // Generate teacher code directly instead of using assignTeacherCode
          const { generateUniqueTeacherCode } = await import('../utils/teacherCodeGenerator');
          const newTeacherCode = await generateUniqueTeacherCode();
          userData.teacherCode = newTeacherCode;
          setTeacherCode(newTeacherCode);
          console.log('🔍 Generated teacher code:', newTeacherCode);

          // Create teacher assignment document
          const { TeacherAssignmentManager } = await import('../utils/teacherAssignments');
          await TeacherAssignmentManager.assignUnitsToTeacher(
            newTeacherCode,
            [], // Start with no units assigned
            displayName,
            userCredential.user.uid
          );
          console.log('🔍 Created teacher assignment document');
        }

        console.log('🔍 Creating user document with data:', userData);
        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        setRole(userRole);
        console.log('🔍 Signup completed successfully');

        // Clear signup flag
        sessionStorage.removeItem('signupInProgress');
      }
    } catch (error) {
      // Clear signup flag on error
      sessionStorage.removeItem('signupInProgress');
      console.error('🔍 Signup failed:', error);
      throw error;
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
      console.log('🔍 Auth state changed, user:', user?.email, user?.uid);
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          console.log('🔍 User document exists:', userDoc.exists());

          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('🔍 User document data:', data);
            setRole((data?.role as string) || null);
            setTeacherCode((data?.teacherCode as string) || null);
            setAssignedTeacherCode((data?.assignedTeacherCode as string) || null);
            console.log('🔍 Set role to:', data?.role);
          } else {
            console.log('🔍 User document does not exist - waiting for signup process to complete');
            // Don't create a default profile during signup - let the signup process handle it
            // Only create default student profile if this is not during signup
            const isSignupInProgress = sessionStorage.getItem('signupInProgress') === 'true';
            if (!isSignupInProgress) {
              console.log('🔍 Creating default student profile for existing user');
              const defaultUserData = {
                uid: user.uid,
                displayName: user.displayName || 'Student',
                email: user.email,
                role: 'student',
                createdAt: new Date(),
                lastActive: new Date()
              };
              await setDoc(userDocRef, defaultUserData);
              setRole('student');
              setTeacherCode(null);
              setAssignedTeacherCode(null);
              console.log('🔍 Created default student profile');
            }
          }
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

