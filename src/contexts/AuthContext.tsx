import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  role: string | null;
  isTeacher: boolean;
  isAdmin: boolean;
  signup: (
    email: string,
    password: string,
    displayName: string,
    role: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
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

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    userRole: string
  ): Promise<void> => {
    try {
      console.log('🔍 Starting signup process for:', email, 'with role:', userRole);

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

        if (userRole === 'teacher') {
          console.log('🔍 Creating teacher account assignment document...');
          const { TeacherAssignmentManager } = await import('../utils/teacherAssignments');
          await TeacherAssignmentManager.assignUnitsToTeacher(
            userCredential.user.uid,
            [],
            displayName
          );
          console.log('🔍 Created teacher assignment document');
        }

        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        setRole(userRole);

        sessionStorage.removeItem('signupInProgress');
      }
    } catch (error) {
      sessionStorage.removeItem('signupInProgress');
      console.error('🔍 Signup failed:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
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

          if (userDoc.exists()) {
            const data = userDoc.data();
            setRole((data?.role as string) || null);
          } else {
            const isSignupInProgress = sessionStorage.getItem('signupInProgress') === 'true';
            if (!isSignupInProgress) {
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
            }
          }
        } catch (err) {
          console.error('Failed to fetch user data:', err);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    role,
    isTeacher: role === 'teacher',
    isAdmin: role === 'teacher',
    signup,
    login,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
