import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

const DashboardRouter: React.FC = () => {
  const { isTeacher, loading, currentUser } = useAuth();
  const { isAuthenticated: isStudentAuth, loading: studentLoading } = useStudentAuth();

  if ((loading || studentLoading) && !isStudentAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentUser) {
    return isTeacher ? <TeacherDashboard /> : <StudentDashboard />;
  }

  if (isStudentAuth) {
    return <StudentDashboard />;
  }

  window.location.href = '/login';
  return null;
};

export default DashboardRouter;
