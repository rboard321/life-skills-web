import React from 'react';
import { Link } from 'react-router-dom';
import { useUnits } from '../hooks/useUnits';
import { useProgress } from '../contexts/ProgressContext';

const Dashboard: React.FC = () => {
  const { units, loading, error } = useUnits();
  const { getUnitProgress } = useProgress();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load units</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate overall progress stats
  const totalUnits = units.length;
  const completedUnits = units.filter(unit => {
    const progress = getUnitProgress(unit.id);
    return progress?.completedAt;
  }).length;

  const inProgressUnits = units.filter(unit => {
    const progress = getUnitProgress(unit.id);
    return !progress?.completedAt && (progress?.overallProgress.lessonsCompleted || 0) > 0;
  }).length;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Dashboard</h1>
        <p className="text-gray-600">Track your progress and continue your life skills journey</p>
      </div>

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📊</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Total Progress</h3>
              <p className="text-sm text-gray-600">
                {completedUnits} of {totalUnits} units completed
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="text-2xl mr-3">✅</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
              <p className="text-2xl font-bold text-green-600">{completedUnits}</p>
              <p className="text-sm text-gray-600">Units finished</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⏳</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">In Progress</h3>
              <p className="text-2xl font-bold text-yellow-600">{inProgressUnits}</p>
              <p className="text-sm text-gray-600">Units started</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/admin"
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
          >
            ⚙️ Admin Panel
          </Link>
        </div>
      </div>

      {/* Units Grid */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Your Learning Units</h2>
        </div>

        {units.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-gray-600 mb-4">No units available yet</p>
            <Link
              to="/admin"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Your First Unit
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map((unit) => {
              const progress = getUnitProgress(unit.id);
              const lessonsCompleted = progress?.overallProgress.lessonsCompleted || 0;
              const totalLessons = unit.totalLessons || 0;
              const isCompleted = progress?.completedAt;
              const isStarted = lessonsCompleted > 0;
              const progressPercentage = totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;

              return (
                <div
                  key={unit.id}
                  className={`bg-white border-2 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 ${
                    isCompleted ? 'border-green-300 bg-green-50' : isStarted ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {/* Unit Header */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{unit.title}</h3>
                    {isCompleted && (
                      <span className="text-green-500 text-xl">✓</span>
                    )}
                  </div>

                  {/* Unit Description */}
                  {unit.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{unit.description}</p>
                  )}

                  {/* Progress Information */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Lessons:</span>
                      <span className="text-blue-600 font-medium">
                        {lessonsCompleted}/{totalLessons}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>

                    {/* Status badge */}
                    <div className="text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        isCompleted ? 
                          'bg-green-100 text-green-800' :
                          isStarted ?
                            'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'
                      }`}>
                        {isCompleted ? 
                          '🎉 Complete' :
                          isStarted ?
                            '⏳ In Progress' :
                            '📚 Not Started'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/unit/${unit.id}`}
                    className={`block w-full text-center py-3 px-4 rounded-md font-medium transition-colors ${
                      isCompleted ?
                        'bg-green-600 hover:bg-green-700 text-white' :
                        isStarted ?
                          'bg-blue-600 hover:bg-blue-700 text-white' :
                          'bg-gray-800 hover:bg-gray-900 text-white'
                    }`}
                  >
                    {isCompleted ? 
                      'Review Unit' :
                      isStarted ?
                        'Continue Learning' :
                        'Start Unit'
                    }
                  </Link>

                  {/* Completion date */}
                  {isCompleted && progress?.completedAt && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Completed on {progress.completedAt.toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
