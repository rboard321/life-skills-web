import React from 'react';
import { Link } from 'react-router-dom';
import { useUnits } from '../hooks/useUnits';
import { useProgress } from '../contexts/ProgressContext';

const Dashboard: React.FC = () => {
  const { units, loading, error } = useUnits();
  const { getUnitProgress } = useProgress();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Failed to load units</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="space-y-4">
        {units.map((unit) => {
          const progress = getUnitProgress(unit.id);
          const activitiesCompleted = progress?.activitiesCompleted.length || 0;
          const totalActivities = unit.activities.length;
          return (
            <div
              key={unit.id}
              className="bg-white shadow rounded p-4 flex justify-between items-center"
            >
              <div>
                <h2 className="text-lg font-semibold">{unit.title}</h2>
                <p className="text-sm text-gray-600">
                  {activitiesCompleted}/{totalActivities} activities completed
                </p>
              </div>
              <Link
                to={`/unit/${unit.id}`}
                className="text-blue-600 hover:underline"
              >
                Open
              </Link>
            </div>
          );
        })}

      </div>
    </div>
  );
};

export default Dashboard;
