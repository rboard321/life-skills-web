import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [isStudentLogin, setIsStudentLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isStudentLogin) {
      // Student login with just teacher code
      if (!teacherCode) {
        setError('Please enter your teacher code');
        return;
      }
    } else {
      // Teacher login with email and password
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }
    }

    try {
      setError('');
      setLoading(true);

      if (isStudentLogin) {
        // Create a temporary student session with teacher code
        const { StudentAccess } = await import('../../utils/teacherAssignments');
        const validation = await StudentAccess.validateTeacherCode(teacherCode);
        if (!validation.valid) {
          throw new Error('Invalid teacher code');
        }

        // Store teacher code in session storage for student access
        sessionStorage.setItem('studentTeacherCode', teacherCode);
        sessionStorage.setItem('isStudent', 'true');

        navigate('/');
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch (error: unknown) {
      let errorMessage = 'Failed to log in';
      if (error instanceof Error) {
        const { code, message } = error as Error & { code?: string };
        errorMessage =
          code === 'auth/invalid-credential'
            ? 'Invalid email or password'
            : message || 'Failed to log in';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Continue your life skills learning journey
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="student-login"
                name="student-login"
                type="checkbox"
                checked={isStudentLogin}
                onChange={(e) => setIsStudentLogin(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="student-login" className="ml-2 block text-sm text-gray-700">
                I'm a student with a teacher code
              </label>
            </div>

            {!isStudentLogin ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required={!isStudentLogin}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required={!isStudentLogin}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your password"
                  />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="teacherCode" className="block text-sm font-medium text-gray-700">
                  Teacher Code
                </label>
                <input
                  id="teacherCode"
                  name="teacherCode"
                  type="text"
                  required={isStudentLogin}
                  value={teacherCode}
                  onChange={(e) => setTeacherCode(e.target.value.toUpperCase())}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-center text-2xl font-mono tracking-widest"
                  placeholder="ABC123"
                  maxLength={6}
                />
                <p className="mt-1 text-xs text-gray-500 text-center">
                  Enter the 6-character code provided by your teacher
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
              Forgot your password?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

