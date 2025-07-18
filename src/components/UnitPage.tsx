import React, { useState } from 'react';
import { useProgress } from '../contexts/ProgressContext';
import type { Unit } from '../data/sampleUnits';
import VideoPlayer from './VideoPlayer';
import ActivityEmbed from './ActivityEmbed';

interface UnitPageProps {
  unit: Unit;
}

const UnitPage: React.FC<UnitPageProps> = ({ unit }) => {
  const { getUnitProgress } = useProgress();
  const [videoCompleted, setVideoCompleted] = useState(false);

  const unitProgress = getUnitProgress(unit.id);
  const isVideoCompleted = unitProgress?.videoCompleted || videoCompleted;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{unit.title}</h1>
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

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Watch the Video</h2>
        <VideoPlayer
          url={unit.videoUrl}
          unitId={unit.id}
          onCompleted={() => setVideoCompleted(true)}
        />
      </div>

      <div>
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

      {unitProgress?.completedAt && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Congratulations! You've completed this unit!
          </h3>
          <p className="text-green-700">
            Completed on {unitProgress.completedAt.toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default UnitPage;
