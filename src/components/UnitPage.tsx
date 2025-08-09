import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useUnits } from '../hooks/useUnits';

const UnitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { units, loading, error } = useUnits();

  const unitId = id ? parseInt(id, 10) : null;
  const unit = units.find(u => u.id === unitId);

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
          <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
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
      </div>

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
              .map((lesson) => (
                <Link
                  key={lesson.id}
                  to={`/unit/${unit.id}/lesson/${lesson.id}`}
                  className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{lesson.title}</h3>
                  {lesson.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{lesson.description}</p>
                  )}
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitPage;
