import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../../contexts/StudentAuthContext';

const KidLogin: React.FC = () => {
  const [kidCode, setKidCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { loginWithKidCode, isAuthenticated } = useStudentAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setKidCode(value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (kidCode.length !== 6) {
      setError('Please enter your 6-character code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loginWithKidCode(kidCode);

      if (result.success) {
        setShowSuccess(true);
        // Wait for animation then navigate
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError(result.error || 'Invalid code. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when 6 characters are entered
  useEffect(() => {
    if (kidCode.length === 6 && !loading && !showSuccess) {
      handleSubmit(new Event('submit') as any);
    }
  }, [kidCode]);

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-9xl mb-8 animate-bounce">🎉</div>
          <h1 className="text-6xl font-bold text-white mb-4">Welcome!</h1>
          <p className="text-2xl text-white">Loading your learning...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              {/* Code Input - 6 Character Boxes */}
              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className={`w-16 h-20 md:w-20 md:h-24 rounded-xl border-4 flex items-center justify-center text-4xl md:text-5xl font-bold transition-all duration-200 ${
                      kidCode[index]
                        ? 'border-green-500 bg-green-50 text-green-700 scale-105'
                        : 'border-gray-300 bg-gray-50 text-gray-400'
                    }`}
                  >
                    {kidCode[index] || '·'}
                  </div>
                ))}
              </div>

              {/* Hidden input for actual typing */}
              <input
                id="kidCode"
                type="text"
                value={kidCode}
                onChange={handleInputChange}
                placeholder="Type your code"
                className="w-full px-6 py-4 text-3xl text-center font-bold border-4 border-blue-300 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 uppercase tracking-widest"
                autoComplete="off"
                autoFocus
                maxLength={6}
                disabled={loading}
              />

              <p className="text-center text-gray-500 mt-4 text-lg">
                {kidCode.length}/6 characters
              </p>
            </div>

            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎓</div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Enter Your Student Code
              </h1>
              <p className="text-lg text-gray-500 mt-2">
                Start your lesson in seconds
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-6 bg-red-100 border-4 border-red-300 rounded-2xl">
                <div className="flex items-center justify-center">
                  <span className="text-4xl mr-3">❌</span>
                  <p className="text-2xl text-red-700 font-semibold">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={kidCode.length !== 6 || loading}
              className={`w-full py-6 px-8 rounded-2xl text-3xl font-bold transition-all duration-200 ${
                kidCode.length === 6 && !loading
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 transform hover:scale-105 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-white mr-4"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                <>
                  <span className="mr-3">🚀</span>
                  Let's Learn!
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
            <p className="text-xl text-center text-blue-800">
              <span className="text-2xl mr-2">💡</span>
              Ask your teacher if you don't have a code
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <a
            href="/login"
            className="text-xl text-white hover:text-blue-100 underline"
          >
            Are you a teacher? Click here
          </a>
        </div>
      </div>
    </div>
  );
};

export default KidLogin;
