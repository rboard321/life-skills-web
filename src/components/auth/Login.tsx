import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const { login, currentUser, role, loading, logout, isTeacher } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser && isTeacher) {
      navigate('/');
    }
  }, [currentUser, isTeacher, loading, navigate]);

  useEffect(() => {
    if (!loading && currentUser && role && role !== 'teacher') {
      setError('This account is not a teacher account.');
      logout();
    }
  }, [currentUser, role, loading, logout]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const message =
        err?.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-3xl p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📚</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Teacher Login</h1>
          <p className="text-gray-600 mt-2">Access your classroom dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              autoComplete="email"
              placeholder="teacher@example.com"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={submitting}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/forgot-password" className="text-sm text-blue-700 hover:underline">
            Forgot your password?
          </Link>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          New here?{' '}
          <Link to="/signup" className="text-blue-700 font-semibold hover:underline">
            Create a teacher account
          </Link>
        </div>

        <div className="mt-6 text-center text-sm">
          <Link to="/kid-login" className="text-gray-500 hover:text-gray-700 underline">
            Student login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
