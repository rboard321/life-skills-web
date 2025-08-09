import React from 'react';
import { Link } from 'react-router-dom';
import { useUnits } from '../hooks/useUnits';

const UnitSelectionPage: React.FC = () => {
  const { units, loading, error } = useUnits();

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
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600">Dashboard</Link>
          <span>→</span>
          <span className="text-gray-900 font-medium">Choose a Unit</span>
        </nav>
      </div>

      <h1 className="text-3xl font-bold text-center mb-8">Choose a Unit to Study</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => (
          <Link
            key={unit.id}
            to={`/unit/${unit.id}`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{unit.title}</h2>
            {unit.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{unit.description}</p>
            )}
            <span className="text-blue-600 font-medium">View Unit →</span>
          </Link>
        ))}
      </div>

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
