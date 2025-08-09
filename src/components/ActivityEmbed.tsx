import React from 'react';
import type { Activity } from '../data/sampleUnits';

interface ActivityEmbedProps {
  activity: Activity;
}

const ActivityEmbed: React.FC<ActivityEmbedProps> = ({ activity }) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">{activity.title || `Activity ${activity.id}`}</h3>
      <iframe
        src={activity.url}
        width="100%"
        height="400"
        title={activity.title || `Activity ${activity.id}`}
        allowFullScreen
        className="rounded-lg shadow-lg"
      />
    </div>
  );
};

export default ActivityEmbed;
