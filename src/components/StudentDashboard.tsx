import React from 'react';
import { Link } from 'react-router-dom';
import { useUnits } from '../hooks/useUnits';
import { useAuth } from '../contexts/AuthContext';

const StudentDashboard: React.FC = () => {
  const { units, loading } = useUnits(true); // Only assigned units
  const { currentUser } = useAuth();

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
                {units.length}
              </div>
              <div className="text-sm text-gray-500">Units Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Units Grid */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {units.map((unit) => (
            <Link
              key={unit.id}
              to={`/unit/${unit.id}/learn`}
              className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group"
            >
              <div className="p-6">
                {/* Unit Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">
                      Unit {unit.order}
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Ready to Learn
                  </div>
                </div>

                {/* Unit Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {unit.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {unit.description}
                </p>

                {/* Learning Steps */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-blue-100 text-blue-600">
                      1
                    </div>
                    <span className="text-sm text-gray-700">
                      Watch Video
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-green-100 text-green-600">
                      2
                    </div>
                    <span className="text-sm text-gray-700">
                      Complete Activity
                    </span>
                  </div>
                </div>

                {/* Action Hint */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Start learning
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
          ))}
        </div>

        {/* Encouragement Message */}
        {units.length > 0 && (
          <div className="mt-8 text-center bg-blue-50 p-6 rounded-lg">
            <div className="text-2xl mb-2">📚</div>
            <h3 className="font-semibold text-blue-900 mb-1">Ready to learn?</h3>
            <p className="text-blue-700 text-sm">
              You have {units.length} unit{units.length !== 1 ? 's' : ''} assigned by your teacher.
              Click on any unit to start learning!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;