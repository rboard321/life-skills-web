import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useProgress } from '../contexts/ProgressContext';
import { useUnits } from '../hooks/useUnits';

const UnitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getUnitProgress } = useProgress();
  const { units, loading, error } = useUnits();

  const unitId = id ? parseInt(id, 10) : null;
  const unit = units.find(u => u.id === unitId);
  const unitProgress = getUnitProgress(unitId || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading unit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading units</p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!unitId || !unit) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600">Dashboard</Link>
          <span>→</span>
          <span className="text-gray-900 font-medium">{unit.title}</span>
        </nav>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{unit.title}</h1>
        {unit.description && <p className="text-gray-600 mb-6">{unit.description}</p>}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Your Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <span className="text-blue-600 font-medium">
                {unitProgress?.overallProgress.lessonsCompleted || 0}/{unit.totalLessons} Lessons
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-600 font-medium">
                {unitProgress?.overallProgress.percentComplete || 0}% Complete
              </span>
            </div>
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                unitProgress?.completedAt ?
                  'bg-green-100 text-green-800' :
                  (unitProgress?.overallProgress.lessonsCompleted || 0) > 0 ?
                    'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-600'
              }`}>
                {unitProgress?.completedAt ?
                  'Unit Complete' :
                  (unitProgress?.overallProgress.lessonsCompleted || 0) > 0 ?
                    'In Progress' :
                    'Not Started'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6">Lessons</h2>
        {unit.lessons && unit.lessons.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No lessons available in this unit yet.</p>
            <Link to="/admin" className="text-blue-600 hover:text-blue-800 font-medium">
              Add lessons in Admin →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {(unit.lessons || [])
              .sort((a, b) => a.order - b.order)
              .map((lesson) => {
                const lessonProgress = unitProgress?.lessonsProgress[lesson.id];
                const isCompleted = lessonProgress?.completedAt;
                const isStarted = lessonProgress?.videoCompleted || (lessonProgress?.activitiesCompleted.length || 0) > 0;
                const activitiesCompleted = lessonProgress?.activitiesCompleted.length || 0;

                return (
                  <div
                    key={lesson.id}
                    className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
                      isCompleted ? 'border-2 border-green-300' : ''
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {lesson.title}
                          </h3>
                          {lesson.description && (
                            <p className="text-gray-600 text-sm mb-3">{lesson.description}</p>
                          )}
                        </div>
                        {isCompleted && <span className="ml-4 text-green-500 text-xl">✓</span>}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Video:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            lessonProgress?.videoCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {lessonProgress?.videoCompleted ? 'Completed' : 'Not Started'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Activities:</span>
                          <span className="text-blue-600 font-medium">
                            {activitiesCompleted}/{lesson.activities.length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isCompleted ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{
                              width: `${((activitiesCompleted + (lessonProgress?.videoCompleted ? 1 : 0)) / (lesson.activities.length + 1)) * 100}%`
                            }}
                          />
                        </div>
                        <div className="text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            isCompleted ? 'bg-green-100 text-green-800' : isStarted ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isCompleted ? '🎉 Complete' : isStarted ? '⏳ In Progress' : '📚 Not Started'}
                          </span>
                        </div>
                      </div>

                      <Link
                        to={`/unit/${unit.id}/lesson/${lesson.id}`}
                        className={`block w-full text-center py-3 px-4 rounded-md font-medium transition-colors ${
                          isCompleted ? 'bg-green-600 hover:bg-green-700 text-white' : isStarted ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-800 hover:bg-gray-900 text-white'
                        }`}
                      >
                        {isCompleted ? 'Review Lesson' : isStarted ? 'Continue Lesson' : 'Start Lesson'}
                      </Link>
                      {isCompleted && lessonProgress?.completedAt && (
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Completed on {lessonProgress.completedAt.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {unitProgress?.completedAt && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">Congratulations! You've completed this entire unit!</h3>
          <p className="text-green-700 mb-4">Completed on {unitProgress.completedAt.toLocaleDateString()}</p>
          <div className="flex justify-center space-x-4">
            <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Back to Dashboard</Link>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Link to="/" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">← Back to Dashboard</Link>
      </div>
    </div>
  );
};

export default UnitPage;
