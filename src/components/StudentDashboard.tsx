import React from 'react';
import { Link } from 'react-router-dom';
import { useUnits } from '../hooks/useUnits';
import { useAuth } from '../contexts/AuthContext';
import type { Unit, UserProgress } from '../data/sampleUnits';

const StudentDashboard: React.FC = () => {
  const { units, loading, userProgress } = useUnits(true); // Only assigned units
  const { currentUser } = useAuth();

  const getUnitProgress = (unitId: number): UserProgress | null => {
    return userProgress.find(progress => progress.unitId === unitId) || null;
  };

  const getProgressStatus = (unit: Unit): 'not-started' | 'video-completed' | 'completed' => {
    const progress = getUnitProgress(unit.id);
    if (!progress) return 'not-started';
    if (progress.completedActivity) return 'completed';
    if (progress.completedVideo) return 'video-completed';
    return 'not-started';
  };

  const getCompletedCount = (): number => {
    return userProgress.filter(p => p.completedActivity).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your units...</p>
        </div>
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Units Assigned</h2>
          <p className="text-gray-600 mb-4">
            Your teacher hasn't assigned any units to you yet. Check back later!
          </p>
          <div className="text-sm text-gray-500">
            Questions? Ask your teacher for help.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Hi, {currentUser?.displayName || 'Student'}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Complete your assigned life skills units
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {getCompletedCount()}/{units.length}
              </div>
              <div className="text-sm text-gray-500">Units Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Progress:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${units.length > 0 ? (getCompletedCount() / units.length) * 100 : 0}%`
                }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">
              {units.length > 0 ? Math.round((getCompletedCount() / units.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Units Grid */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {units.map((unit) => {
            const status = getProgressStatus(unit);
            const progress = getUnitProgress(unit.id);

            return (
              <Link
                key={unit.id}
                to={`/unit/${unit.id}/learn`}
                className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group"
              >
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        Unit {unit.order}
                      </span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : status === 'video-completed'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {status === 'completed'
                        ? '✓ Completed'
                        : status === 'video-completed'
                        ? 'Video Done'
                        : 'Not Started'
                      }
                    </div>
                  </div>

                  {/* Unit Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {unit.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {unit.description}
                  </p>

                  {/* Progress Steps */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        progress?.completedVideo
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {progress?.completedVideo ? '✓' : '1'}
                      </div>
                      <span className={`text-sm ${
                        progress?.completedVideo ? 'text-gray-900 font-medium' : 'text-gray-600'
                      }`}>
                        Watch Video
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        progress?.completedActivity
                          ? 'bg-green-600 text-white'
                          : progress?.completedVideo
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {progress?.completedActivity ? '✓' : '2'}
                      </div>
                      <span className={`text-sm ${
                        progress?.completedActivity
                          ? 'text-gray-900 font-medium'
                          : progress?.completedVideo
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}>
                        Complete Activity
                      </span>
                    </div>
                  </div>

                  {/* Action Hint */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {status === 'completed'
                          ? 'Review completed'
                          : status === 'video-completed'
                          ? 'Continue to activity'
                          : 'Start learning'
                        }
                      </span>
                      <div className="text-blue-600 group-hover:text-blue-800 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Encouragement Message */}
        {getCompletedCount() > 0 && getCompletedCount() < units.length && (
          <div className="mt-8 text-center bg-blue-50 p-6 rounded-lg">
            <div className="text-2xl mb-2">🎉</div>
            <h3 className="font-semibold text-blue-900 mb-1">Great job!</h3>
            <p className="text-blue-700 text-sm">
              You've completed {getCompletedCount()} unit{getCompletedCount() !== 1 ? 's' : ''}.
              Keep going to finish all your assigned units!
            </p>
          </div>
        )}

        {getCompletedCount() === units.length && units.length > 0 && (
          <div className="mt-8 text-center bg-green-50 p-6 rounded-lg">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-bold text-green-900 mb-1">Congratulations!</h3>
            <p className="text-green-700">
              You've completed all your assigned units! Great work on your life skills learning journey.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;