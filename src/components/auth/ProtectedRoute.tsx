import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentAuth } from '../../contexts/StudentAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiresAdmin }) => {
  const { currentUser, loading, role } = useAuth();
  const { isAuthenticated: isStudentAuth, loading: studentLoading } = useStudentAuth();

  if ((loading || studentLoading) && !isStudentAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isStudentAuth) {
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
