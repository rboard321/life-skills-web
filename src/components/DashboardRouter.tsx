import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

const DashboardRouter: React.FC = () => {
  const { isTeacher, loading, currentUser, role } = useAuth();

  console.log('🔍 DashboardRouter - isTeacher:', isTeacher, 'role:', role, 'loading:', loading, 'currentUser:', currentUser?.email);

  // Check if this is a student session (no auth but has teacher code)
  const isStudentSession = sessionStorage.getItem('isStudent') === 'true';
  const studentTeacherCode = sessionStorage.getItem('studentTeacherCode');

  if (loading && !isStudentSession) {
    console.log('🔍 DashboardRouter - showing loading screen');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // If student session, show student dashboard
  if (isStudentSession && studentTeacherCode) {
    console.log('🔍 DashboardRouter - showing student dashboard (session mode)');
    return <StudentDashboard />;
  }

  // If authenticated user, show appropriate dashboard
  if (currentUser) {
    console.log('🔍 DashboardRouter - authenticated user, showing:', isTeacher ? 'TeacherDashboard' : 'StudentDashboard');
    return isTeacher ? <TeacherDashboard /> : <StudentDashboard />;
  }

  // If no auth and no student session, redirect to login
  console.log('🔍 DashboardRouter - no auth, redirecting to login');
  window.location.href = '/login';
  return null;
};

export default DashboardRouter;