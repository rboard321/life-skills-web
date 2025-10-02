import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { currentUser, logout, isTeacher } = useAuth();
  const navigate = useNavigate();

  // Check if this is a student session
  const isStudentSession = sessionStorage.getItem('isStudent') === 'true';
  const studentTeacherCode = sessionStorage.getItem('studentTeacherCode');

  const handleLogout = async () => {
    try {
      if (isStudentSession) {
        // Clear student session storage
        sessionStorage.removeItem('isStudent');
        sessionStorage.removeItem('studentTeacherCode');
        navigate('/login');
      } else {
        await logout();
        navigate('/login');
      }
    } catch {
      console.error('Failed to log out');
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              Life Skills Learning
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {currentUser || (isStudentSession && studentTeacherCode) ? (
              <>
                <span className="text-gray-700">
                  {currentUser
                    ? `Hi, ${currentUser.displayName || currentUser.email}`
                    : `Student (Code: ${studentTeacherCode})`
                  }
                </span>
                {isTeacher && (
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
