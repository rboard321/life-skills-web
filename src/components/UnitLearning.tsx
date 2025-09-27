import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUnits } from '../hooks/useUnits';
import SimpleVideoPlayer from './SimpleVideoPlayer';
import { getEmbeddableActivityUrl, getActivityInstructions } from '../utils/activityUrls';
import { optimizeYouTubeUrl } from '../utils/youtube';
import { OptimizedProgressTracker } from '../utils/firebase-optimized';

const UnitLearning: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { units, loading, userProgress } = useUnits(true);

  const [currentStep, setCurrentStep] = useState<'video' | 'activity'>('video');
  const [videoWatched, setVideoWatched] = useState(false);
  const [activityCompleted, setActivityCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  const unitId = id ? parseInt(id, 10) : null;
  const unit = units.find(u => u.id === unitId);
  const progress = userProgress.find(p => p.unitId === unitId);

  useEffect(() => {
    if (progress) {
      setVideoWatched(progress.completedVideo);
      setActivityCompleted(progress.completedActivity);

      // Set current step based on progress
      if (progress.completedActivity) {
        setCurrentStep('activity'); // Show completed activity
      } else if (progress.completedVideo) {
        setCurrentStep('activity'); // Video done, move to activity
      } else {
        setCurrentStep('video'); // Start with video
      }
    }
  }, [progress]);

  const updateUserProgress = async (videoComplete: boolean, activityComplete: boolean) => {
    if (!currentUser || !unitId) return;

    setSaving(true);
    try {
      const progressTracker = new OptimizedProgressTracker(currentUser.uid);

      // Use the optimized progress tracking
      if (videoComplete && !videoWatched) {
        await progressTracker.updateVideoProgress(unitId, 0, 100, true);
      }

      if (activityComplete && !activityCompleted) {
        await progressTracker.completeActivity(unitId, 1);
      }

      setVideoWatched(videoComplete);
      setActivityCompleted(activityComplete);
    } catch (error) {
      console.error('Failed to update progress:', error);
      // Show user-friendly error
      alert('Failed to save progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleVideoComplete = async () => {
    await updateUserProgress(true, activityCompleted);
    setCurrentStep('activity');
  };

  const handleActivityComplete = async () => {
    await updateUserProgress(videoWatched, true);
  };

  const goBackToDashboard = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading unit...</p>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unit Not Found</h2>
          <p className="text-gray-600 mb-4">
            This unit doesn't exist or isn't assigned to you.
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goBackToDashboard}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <div className="text-sm text-gray-500">Unit {unit.order}</div>
              <h1 className="text-2xl font-bold text-gray-900">{unit.title}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => setCurrentStep('video')}
              className={`flex items-center gap-3 hover:opacity-80 transition-opacity ${
                currentStep === 'video' ? 'text-blue-600' : videoWatched ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                videoWatched
                  ? 'bg-green-600 text-white'
                  : currentStep === 'video'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {videoWatched ? '✓' : '1'}
              </div>
              <span className="font-medium">Watch Video</span>
            </button>

            <div className={`w-16 h-0.5 ${videoWatched ? 'bg-green-600' : 'bg-gray-300'}`}></div>

            <button
              onClick={() => videoWatched && setCurrentStep('activity')}
              disabled={!videoWatched}
              className={`flex items-center gap-3 transition-opacity ${
                videoWatched ? 'hover:opacity-80' : 'cursor-not-allowed'
              } ${
                currentStep === 'activity'
                  ? activityCompleted
                    ? 'text-green-600'
                    : 'text-blue-600'
                  : 'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                activityCompleted
                  ? 'bg-green-600 text-white'
                  : currentStep === 'activity' && videoWatched
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {activityCompleted ? '✓' : '2'}
              </div>
              <span className="font-medium">Complete Activity</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 'video' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Watch the Video
              </h2>
              <p className="text-gray-600 mb-6">
                {unit.description}
              </p>

              <SimpleVideoPlayer
                url={optimizeYouTubeUrl(unit.videoUrl)}
                title={unit.title}
                canMarkComplete={true}
                isCompleted={videoWatched}
                onVideoComplete={handleVideoComplete}
                allowRewatch={true}
              />

              {videoWatched && (
                <div className="mt-6">
                  <button
                    onClick={() => setCurrentStep('activity')}
                    className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    Continue to Activity
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 'activity' && (
          <div className="space-y-6">
            {!videoWatched && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-center gap-2 text-yellow-800 mb-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Complete the video first</span>
                </div>
                <p className="text-sm text-yellow-700">
                  You need to watch the video before you can access the activity.
                </p>
                <button
                  onClick={() => setCurrentStep('video')}
                  className="mt-2 text-yellow-800 hover:text-yellow-900 underline text-sm"
                >
                  Go back to video
                </button>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Interactive Activity
                    </h2>
                    <p className="text-gray-600">
                      Complete this activity to test your understanding of the video content.
                    </p>
                  </div>
                  {videoWatched && (
                    <button
                      onClick={() => setCurrentStep('video')}
                      className="ml-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Video
                    </button>
                  )}
                </div>
              </div>

              {videoWatched ? (
                <>
                  <div className="aspect-video">
                    <iframe
                      src={getEmbeddableActivityUrl(unit.activityUrl, unit.activityType)}
                      className="w-full h-full"
                      style={{maxWidth: '100%'}}
                      width="500"
                      height="380"
                      frameBorder="0"
                      allowFullScreen
                      title={`${unit.title} Activity`}
                    ></iframe>
                  </div>

                  <div className="p-6">
                    {!activityCompleted ? (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                          🎮 {getActivityInstructions(unit.activityType)}
                        </p>
                        <button
                          onClick={handleActivityComplete}
                          disabled={saving}
                          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {saving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              I'm Done with Activity
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-6 rounded-md text-center">
                        <div className="text-4xl mb-3">🎉</div>
                        <h3 className="font-bold text-green-900 mb-2">Congratulations!</h3>
                        <p className="text-green-700 mb-4">
                          You've completed "{unit.title}"! Great job learning these important life skills.
                        </p>
                        <button
                          onClick={goBackToDashboard}
                          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Back to Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">🔒</div>
                    <p>Activity locked until video is completed</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitLearning;