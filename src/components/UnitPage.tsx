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
    <div className="max-w-6xl mx-auto p-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600">Dashboard</Link>
          <span>→</span>
          <span className="text-gray-900 font-medium">{unit.title}</span>
        </nav>
      </div>

      {/* Unit Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{unit.title}</h1>
        {unit.description && <p className="text-gray-600 mb-6">{unit.description}</p>}
        
        {/* Progress Overview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">Your Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {unitProgress?.overallProgress.lessonsCompleted || 0}
              </div>
              <div className="text-sm text-gray-600">
                of {unit.totalLessons || 0} lessons completed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {unitProgress?.overallProgress.percentComplete || 0}%
              </div>
              <div className="text-sm text-gray-600">Overall progress</div>
            </div>
            <div className="text-center">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                unitProgress?.completedAt ?
                  'bg-green-100 text-green-800' :
                  (unitProgress?.overallProgress.lessonsCompleted || 0) > 0 ?
                    'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-600'
              }`}>
                {unitProgress?.completedAt ?
                  '🎉 Unit Complete' :
                  (unitProgress?.overallProgress.lessonsCompleted || 0) > 0 ?
                    '⏳ In Progress' :
                    '📚 Not Started'
                }
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  unitProgress?.completedAt ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{
                  width: `${unitProgress?.overallProgress.percentComplete || 0}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lessons Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Lessons</h2>
          <Link to="/admin" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Add lessons in Admin →
          </Link>
        </div>

        {!unit.lessons || unit.lessons.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No lessons available</h3>
            <p className="text-gray-600 mb-4">This unit doesn't have any lessons yet.</p>
            <Link 
              to="/admin" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add lessons in Admin
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unit.lessons
              .sort((a, b) => a.order - b.order)
              .map((lesson) => {
                const lessonProgress = unitProgress?.lessonsProgress[lesson.id];
                const isCompleted = lessonProgress?.completedAt;
                const isStarted = lessonProgress?.videoCompleted || (lessonProgress?.activitiesCompleted.length || 0) > 0;
                const activitiesCompleted = lessonProgress?.activitiesCompleted.length || 0;
                const totalActivities = lesson.activities.length;
                const progressItems = totalActivities + 1; // activities + video
                const completedItems = activitiesCompleted + (lessonProgress?.videoCompleted ? 1 : 0);
                const progressPercentage = progressItems > 0 ? (completedItems / progressItems) * 100 : 0;

                return (
                  <div
                    key={lesson.id}
                    className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border-2 ${
                      isCompleted ? 'border-green-300 shadow-green-100' : isStarted ? 'border-blue-300 shadow-blue-100' : 'border-gray-200'
                    }`}
                  >
                    {/* Lesson Card Header */}
                    <div className="relative">
                      {/* Placeholder for lesson image */}
                      <div className={`h-32 ${isCompleted ? 'bg-green-100' : isStarted ? 'bg-blue-100' : 'bg-gray-100'} flex items-center justify-center`}>
                        <div className="text-4xl">
                          {isCompleted ? '🎓' : isStarted ? '📖' : '📚'}
                        </div>
                      </div>
                      
                      {/* Completion Badge */}
                      {isCompleted && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Lesson Card Content */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {lesson.title}
                      </h3>
                      
                      {lesson.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {lesson.description}
                        </p>
                      )}

                      {/* Progress Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Video:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            lessonProgress?.videoCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {lessonProgress?.videoCompleted ? '✓ Completed' : 'Not Started'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Activities:</span>
                          <span className="text-blue-600 font-medium">
                            {activitiesCompleted}/{totalActivities}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isCompleted ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>

                        {/* Status */}
                        <div className="text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            isCompleted ? 'bg-green-100 text-green-800' : 
                            isStarted ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {isCompleted ? '🎉 Complete' : isStarted ? '⏳ In Progress' : '📚 Not Started'}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link
                        to={`/unit/${unit.id}/lesson/${lesson.id}`}
                        className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition-colors ${
                          isCompleted ? 
                            'bg-green-600 hover:bg-green-700 text-white' : 
                            isStarted ? 
                              'bg-blue-600 hover:bg-blue-700 text-white' : 
                              'bg-gray-800 hover:bg-gray-900 text-white'
                        }`}
                      >
                        {isCompleted ? 'Review Lesson' : isStarted ? 'Continue Lesson' : 'Start Lesson'}
                      </Link>

                      {/* Completion Date */}
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

      {/* Unit Completion Celebration */}
      {unitProgress?.completedAt && (
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-green-900 mb-2">
            Congratulations! You've completed this entire unit!
          </h3>
          <p className="text-green-700 mb-6">
            Completed on {unitProgress.completedAt.toLocaleDateString()}
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
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

export default UnitPage;
