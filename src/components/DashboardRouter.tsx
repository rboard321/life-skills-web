import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

const DashboardRouter: React.FC = () => {
  const { isTeacher, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return isTeacher ? <TeacherDashboard /> : <StudentDashboard />;
};

export default DashboardRouter;