import React from 'react';
import { Link } from 'react-router-dom';
import { useUnits } from '../hooks/useUnits';
import { useProgress } from '../contexts/ProgressContext';

const UnitSelectionPage: React.FC = () => {
  const { units, loading, error } = useUnits();
  const { getUnitProgress } = useProgress();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading units...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {String(error)}</p>
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

  if (units.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No units available</p>
          <Link 
            to="/admin" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Units in Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Navigation breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600">Dashboard</Link>
          <span>→</span>
          <span className="text-gray-900 font-medium">Choose a Unit</span>
        </nav>
      </div>

      <h1 className="text-3xl font-bold text-center mb-8">Choose a Unit to Study</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => {
          const progress = getUnitProgress(unit.id);
          const activitiesCompleted = progress?.activitiesCompleted.length || 0;
          const totalActivities = unit.activities.length;
          const isCompleted = progress?.completedAt;
          const isStarted = progress?.videoCompleted || activitiesCompleted > 0;

          return (
            <div
              key={unit.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
                isCompleted ? 'border-2 border-green-300' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex-1">
                    {unit.title}
                  </h2>
                  {isCompleted && (
                    <span className="ml-2 text-green-500 text-xl">✓</span>
                  )}
                </div>

                {/* Progress indicators */}
                <div className="space-y-3 mb-6">
                  {/* Video progress */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Video:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      progress?.videoCompleted ? 
                        'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-600'
                    }`}>
                      {progress?.videoCompleted ? 'Completed' : 'Not Started'}
                    </span>
                  </div>

                  {/* Activities progress */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Activities:</span>
                    <span className="text-blue-600 font-medium">
                      {activitiesCompleted}/{totalActivities}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{
                        width: `${((activitiesCompleted + (progress?.videoCompleted ? 1 : 0)) / (totalActivities + 1)) * 100}%`
                      }}
                    />
                  </div>

                  {/* Overall status */}
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

                {/* Action button */}
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
            </div>
          );
        })}
      </div>

      {/* Back to dashboard button */}
      <div className="mt-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default UnitSelectionPage;
