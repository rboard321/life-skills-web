import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiresAdmin }) => {
  const { currentUser, loading, role } = useAuth();

  // Check if this is a student session (no auth but has teacher code)
  const isStudentSession = sessionStorage.getItem('isStudent') === 'true';
  const studentTeacherCode = sessionStorage.getItem('studentTeacherCode');

  if (loading && !isStudentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Allow student sessions with valid teacher codes
  if (isStudentSession && studentTeacherCode) {
    // Student sessions cannot access admin routes
    if (requiresAdmin) {
      return <Navigate to="/" />;
    }
    return <>{children}</>;
  }

  // For authenticated users
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requiresAdmin && role !== 'teacher') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};
