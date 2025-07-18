import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { useUnits } from '../hooks/useUnits';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { userProgress } = useProgress();
  const { units } = useUnits();

  
  // Calculate overall stats
  const totalUnits = units.length;
  const completedUnits = userProgress.filter(p => p.completedAt).length;
  const inProgressUnits = userProgress.filter(p => p.videoWatchTime > 0 && !p.completedAt).length;
  const totalVideosWatched = userProgress.filter(p => p.videoCompleted).length;
  const totalActivitiesCompleted = userProgress.reduce((sum, p) => sum + p.activitiesCompleted.length, 0);

  // Calculate learning streak (simplified version)
  const getLearningStreak = () => {
    const recentProgress = userProgress
      .filter(p => p.lastAccessedAt)
      .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime());
    
    if (recentProgress.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const progress of recentProgress) {
      const progressDate = new Date(progress.lastAccessedAt);
      progressDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - progressDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const learningStreak = getLearningStreak();


  const getUnitForProgress = (unitId: number) => {
    return units.find(u => u.id === unitId);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {currentUser?.displayName || 'Learner'}! 👋
        </h1>
        <p className="text-gray-600">Here's your learning progress and achievements.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              📚
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Units Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedUnits}/{totalUnits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              🎥
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Videos Watched</p>
              <p className="text-2xl font-bold text-gray-900">{totalVideosWatched}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              ⚡
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Activities Done</p>
              <p className="text-2xl font-bold text-gray-900">{totalActivitiesCompleted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
              🔥
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Learning Streak</p>
              <p className="text-2xl font-bold text-gray-900">{learningStreak} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Continue Learning */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Continue Learning</h2>
          </div>
          <div className="p-6">
            {inProgressUnits > 0 ? (
              <div className="space-y-4">
                {userProgress
                  .filter(p => p.videoWatchTime > 0 && !p.completedAt)
                  .slice(0, 3)
                  .map(progress => {
                    const unit = getUnitForProgress(progress.unitId);
                    if (!unit) return null;
                    
                    const videoProgress = progress.videoDuration > 0 ? 
                      (progress.videoWatchTime / progress.videoDuration) * 100 : 0;
                    
                    return (
                      <div key={progress.unitId} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{unit.title}</h3>
                          <span className="text-sm text-gray-500">
                            {Math.round(videoProgress)}% watched
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${videoProgress}%` }}
                          />
                        </div>
                        <Link 
                          to={`/unit/${unit.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Continue Learning →
                        </Link>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">No units in progress</p>
                <Link 
                  to="/units"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Learning
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* First Video Achievement */}
              <div className={`flex items-center p-3 rounded-lg ${
                totalVideosWatched > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              } border`}>
                <span className="text-2xl mr-3">
                  {totalVideosWatched > 0 ? '🎬' : '⭕'}
                </span>
                <div>
                  <p className="font-medium">First Video</p>
                  <p className="text-sm text-gray-600">Watch your first video</p>
                </div>
                {totalVideosWatched > 0 && (
                  <span className="ml-auto text-green-600 text-sm font-medium">✓</span>
                )}
              </div>

              {/* First Unit Achievement */}
              <div className={`flex items-center p-3 rounded-lg ${
                completedUnits > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              } border`}>
                <span className="text-2xl mr-3">
                  {completedUnits > 0 ? '🏆' : '⭕'}
                </span>
                <div>
                  <p className="font-medium">Unit Master</p>
                  <p className="text-sm text-gray-600">Complete your first unit</p>
                </div>
                {completedUnits > 0 && (
                  <span className="ml-auto text-green-600 text-sm font-medium">✓</span>
                )}
              </div>

              {/* Streak Achievement */}
              <div className={`flex items-center p-3 rounded-lg ${
                learningStreak >= 3 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              } border`}>
                <span className="text-2xl mr-3">
                  {learningStreak >= 3 ? '🔥' : '⭕'}
                </span>
                <div>
                  <p className="font-medium">On Fire</p>
                  <p className="text-sm text-gray-600">3-day learning streak</p>
                </div>
                {learningStreak >= 3 && (
                  <span className="ml-auto text-green-600 text-sm font-medium">✓</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Units Progress */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Units</h2>
        </div>
        <div className="p-6">
          {units.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map(unit => {
                const progress = userProgress.find(p => p.unitId === unit.id);
                const videoProgress = progress?.videoDuration ? 
                  (progress.videoWatchTime / progress.videoDuration) * 100 : 0;
                const activitiesCompleted = progress?.activitiesCompleted.length || 0;
                
                return (
                  <Link
                    key={unit.id}
                    to={`/unit/${unit.id}`}
                    className="block border rounded-lg p-4 hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{unit.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        progress?.completedAt ? 'bg-green-100 text-green-800' :
                        progress?.videoWatchTime ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {progress?.completedAt ? 'Complete' :
                         progress?.videoWatchTime ? 'In Progress' : 'Not Started'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      Video: {Math.round(videoProgress)}% • Activities: {activitiesCompleted}/{unit.activities.length}
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          progress?.completedAt ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: `${progress?.completedAt ? 100 : 
                            (videoProgress + (activitiesCompleted / unit.activities.length * 100)) / 2}%` 
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No units available yet</p>
              <Link 
                to="/admin"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add units in Admin →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
