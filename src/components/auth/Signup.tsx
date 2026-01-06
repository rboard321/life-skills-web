import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signup(email.trim(), password, displayName.trim(), 'teacher');
      navigate('/');
    } catch (err: any) {
      const message =
        err?.code === 'auth/email-already-in-use'
          ? 'This email is already registered. Please login instead.'
          : err?.code === 'auth/weak-password'
          ? 'Password is too weak. Please use a stronger password.'
          : err?.code === 'auth/invalid-email'
          ? 'Invalid email address.'
          : 'Signup failed. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-3xl p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎓</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Create Teacher Account</h1>
          <p className="text-gray-600 mt-2">Start managing your classroom</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Ms. Smith"
              disabled={submitting}
              required
            />
          </div>

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
              required
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
              autoComplete="new-password"
              placeholder="At least 6 characters"
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              disabled={submitting}
              required
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
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-700 font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
