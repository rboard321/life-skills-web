import React, { useState } from 'react';
import { useProgress } from '../contexts/ProgressContext';
import type { Activity } from '../data/sampleUnits';

interface ActivityEmbedProps {
  activity: Activity;
  unitId: number;
  lessonId: number;
  isUnlocked: boolean;
}

const ActivityEmbed: React.FC<ActivityEmbedProps> = ({ activity, unitId, lessonId, isUnlocked }) => {
  const { markLessonActivityCompleted, getUnitProgress } = useProgress();
  const [isCompleted, setIsCompleted] = useState(false);

  const unitProgress = getUnitProgress(unitId);
  const lessonProgress = unitProgress?.lessonsProgress[lessonId];
  const isActivityCompleted = lessonProgress?.activitiesCompleted.includes(activity.id) || false;

  const handleActivityComplete = () => {
    if (!isCompleted && !isActivityCompleted) {
      setIsCompleted(true);
      markLessonActivityCompleted(unitId, lessonId, activity.id);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="mt-6 p-6 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-4xl mb-2">🔒</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Activity Locked</h3>
          <p className="text-gray-600">Complete the video above to unlock this activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{activity.title || `Activity ${activity.id}`}</h3>
        {(isCompleted || isActivityCompleted) && (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            ✓ Completed
          </span>
        )}
      </div>

      <div className="relative">
        <iframe
          src={activity.url}
          width="100%"
          height="400"
          title={activity.title || `Activity ${activity.id}`}
          allowFullScreen
          className="rounded-lg shadow-lg"
          onLoad={() => {
            setTimeout(() => {
              handleActivityComplete();
            }, 30000);
          }}
        />

        {!isCompleted && !isActivityCompleted && (
          <div className="mt-2">
            <button
              onClick={handleActivityComplete}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              Mark as Completed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityEmbed;
