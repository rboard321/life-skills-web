
import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useProgress } from '../contexts/ProgressContext';
import { useUnits } from '../hooks/useUnits';
import VideoPlayer from './VideoPlayer';
import ActivityEmbed from './ActivityEmbed';

const IndividualUnitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getUnitProgress } = useProgress();
  const { units, loading, error } = useUnits();
  const [videoCompleted, setVideoCompleted] = useState(false);

  // Convert string id to number
  const unitId = id ? parseInt(id, 10) : null;
  
  // Find the specific unit
  const unit = units.find(u => u.id === unitId);
  
  // Get progress for this unit
  const unitProgress = getUnitProgress(unitId || 0);
  const isVideoCompleted = unitProgress?.videoCompleted || videoCompleted;

  // Loading state
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

  // Error state
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

  // Invalid ID or unit not found
  if (!unitId || !unit) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Navigation breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600">Dashboard</Link>
          <span>→</span>
          <Link to="/units" className="hover:text-blue-600">All Units</Link>
          <span>→</span>
          <span className="text-gray-900 font-medium">{unit.title}</span>
        </nav>
      </div>

      {/* Unit header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{unit.title}</h1>
        
        {/* Progress overview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Your Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${
                isVideoCompleted ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span>Video {isVideoCompleted ? 'Completed' : 'In Progress'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-600 font-medium">
                {unitProgress?.activitiesCompleted.length || 0}/{unit.activities.length} Activities
              </span>
            </div>
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                unitProgress?.completedAt ?
                  'bg-green-100 text-green-800' :
                  isVideoCompleted ?
                    'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-600'
              }`}>
                {unitProgress?.completedAt ?
                  'Unit Complete' :
                  isVideoCompleted ?
                    'In Progress' :
                    'Not Started'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Video section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Watch the Video</h2>
        <VideoPlayer
          url={unit.videoUrl}
          unitId={unit.id}
          onCompleted={() => setVideoCompleted(true)}
        />
      </div>

      {/* Activities section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Complete the Activities</h2>
        <div className="space-y-6">
          {unit.activities.map(activity => (
            <ActivityEmbed
              key={activity.id}
              activity={activity}
              unitId={unit.id}
              isUnlocked={isVideoCompleted}
            />
          ))}
        </div>
      </div>

      {/* Completion celebration */}
      {unitProgress?.completedAt && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Congratulations! You've completed this unit!
          </h3>
          <p className="text-green-700 mb-4">
            Completed on {unitProgress.completedAt.toLocaleDateString()}
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
            <Link
              to="/units"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Choose Another Unit
            </Link>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Back to Dashboard
        </Link>
        
        <Link
          to="/units"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
        >
          View All Units →
        </Link>
      </div>
    </div>
  );
};

export default IndividualUnitPage;
