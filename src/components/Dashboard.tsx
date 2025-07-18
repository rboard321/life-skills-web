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
    return !progress?.completedAt && (progress?.videoCompleted || (progress?.activitiesCompleted.length || 0) > 0);
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
            to="/units"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
          >
            📚 Browse All Units
          </Link>
          {inProgressUnits > 0 && (
            <Link
              to="/units"
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
            >
              ⏳ Continue Learning
            </Link>
          )}
          <Link
            to="/admin"
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
          >
            ⚙️ Admin Panel
          </Link>
        </div>
      </div>

      {/* Recent Units */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Your Units</h2>
          <Link 
            to="/units" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </Link>
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
          <div className="space-y-4">
            {units.slice(0, 5).map((unit) => {
              const progress = getUnitProgress(unit.id);
              const activitiesCompleted = progress?.activitiesCompleted.length || 0;
              const totalActivities = unit.activities.length;
              const isCompleted = progress?.completedAt;
              const isStarted = progress?.videoCompleted || activitiesCompleted > 0;

              return (
                <div
                  key={unit.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{unit.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>
                        Video: {progress?.videoCompleted ? '✅' : '⭕'}
                      </span>
                      <span>
                        Activities: {activitiesCompleted}/{totalActivities}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        isCompleted ? 
                          'bg-green-100 text-green-800' :
                          isStarted ?
                            'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'
                      }`}>
                        {isCompleted ? 'Complete' : isStarted ? 'In Progress' : 'Not Started'}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/unit/${unit.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium px-4 py-2"
                  >
                    {isCompleted ? 'Review' : isStarted ? 'Continue' : 'Start'} →
                  </Link>
                </div>
              );
            })}
            
            {units.length > 5 && (
              <div className="text-center pt-4">
                <Link
                  to="/units"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View {units.length - 5} more units →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
