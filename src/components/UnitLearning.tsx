import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUnits } from '../hooks/useUnits';
import YouTubeProgressPlayer from './YouTubeProgressPlayer';
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
  const [activityUnlocked, setActivityUnlocked] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const unitId = id ? parseInt(id, 10) : null;
  const unit = units.find(u => u.id === unitId);
  const progress = userProgress.find(p => p.unitId === unitId);

  useEffect(() => {
    const loadUserProgress = async () => {
      if (progress) {
        setVideoWatched(progress.completedVideo);
        setActivityCompleted(progress.completedActivity);
        setActivityUnlocked(progress.completedVideo); // Legacy fallback
        setVideoProgress(progress.videoProgress?.percentWatched || 0);
      }

      // Load detailed progress from Firestore if available
      if (currentUser && unitId) {
        try {
          const progressTracker = new OptimizedProgressTracker(currentUser.uid);
          const detailedProgress = await progressTracker.getUserProgress(unitId);

          if (detailedProgress) {
            setVideoWatched(detailedProgress.completedVideo);
            setActivityCompleted(detailedProgress.completedActivity);
            setActivityUnlocked(detailedProgress.unlockedActivity || detailedProgress.completedVideo);
            setVideoProgress(detailedProgress.videoProgress?.percentWatched || 0);

            console.log('Loaded detailed progress:', {
              unitId,
              percentWatched: detailedProgress.videoProgress?.percentWatched || 0,
              totalWatchedTime: detailedProgress.videoProgress?.totalWatchedTime || 0,
              milestonesReached: detailedProgress.videoProgress?.milestonesReached || [],
              sessionCount: detailedProgress.videoProgress?.sessionCount || 0
            });
          }
        } catch (error) {
          console.error('Error loading detailed progress:', error);
        }
      }

      // Set current step based on progress
      if (progress?.completedActivity) {
        setCurrentStep('activity'); // Show completed activity
      } else if (activityUnlocked) {
        setCurrentStep('video'); // Stay on video, but activity is unlocked
      } else {
        setCurrentStep('video'); // Start with video
      }
    };

    loadUserProgress();
  }, [progress, currentUser, unitId, activityUnlocked]);

  const updateUserProgress = async (videoComplete: boolean, activityComplete: boolean) => {
    if (!currentUser || !unitId) return;

    setSaving(true);
    try {
      const progressTracker = new OptimizedProgressTracker(currentUser.uid);

      // Use the optimized progress tracking
      if (videoComplete && !videoWatched) {
        await progressTracker.updateVideoProgress(unitId, 100, 100, 100, [25, 50, 75, 90], true);
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
    setVideoWatched(true);
    setActivityUnlocked(true);
    await updateUserProgress(true, activityCompleted);
    // Don't auto-navigate to activity - let user choose when to continue
  };

  // Handle milestone-based progress updates from the YouTube player
  const handleProgressUpdate = async (totalWatchedTime: number, totalSeconds: number, percentWatched: number) => {
    if (!currentUser || !unitId) return;

    console.log('UnitLearning received milestone progress update:', {
      unitId,
      userId: currentUser.uid,
      totalWatchedTime: Math.round(totalWatchedTime),
      totalSeconds: Math.round(totalSeconds),
      percentWatched: Math.round(percentWatched),
      activityUnlocked
    });

    setVideoProgress(percentWatched);

    // Auto-unlock activity at 90%
    if (percentWatched >= 90 && !activityUnlocked) {
      console.log('🎯 Unlocking activity at 90%!');
      setActivityUnlocked(true);
    }

    // Update progress in database using new milestone-based method
    try {
      const progressTracker = new OptimizedProgressTracker(currentUser.uid);

      // Calculate which milestones have been reached
      const milestones = [25, 50, 75, 90].filter(m => percentWatched >= m);

      await progressTracker.updateMilestones(
        unitId,
        totalWatchedTime,
        totalSeconds,
        totalWatchedTime, // Use total watched time as last position for now
        milestones
      );

      console.log('✅ Milestone progress updated successfully');
    } catch (error) {
      console.error('❌ Failed to update milestone progress:', error);
    }
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

              <YouTubeProgressPlayer
                url={optimizeYouTubeUrl(unit.videoUrl)}
                title={unit.title}
                canMarkComplete={true}
                isCompleted={videoWatched}
                onVideoComplete={handleVideoComplete}
                onProgressUpdate={handleProgressUpdate}
                allowRewatch={true}
                currentProgress={videoProgress}
              />

              {/* Activity Button with Smart States */}
              <div className="mt-6">
                {activityUnlocked || videoWatched ? (
                  <button
                    onClick={() => setCurrentStep('activity')}
                    className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 w-full justify-center"
                  >
                    {activityCompleted ? '🔄 Redo Activity' : '🎯 Continue to Activity'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      disabled
                      className="bg-gray-400 text-white px-6 py-3 rounded-md cursor-not-allowed flex items-center gap-2 w-full justify-center opacity-60"
                    >
                      🔒 Activity Locked
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </button>

                    {/* Progress-based messaging */}
                    <div className="text-center text-sm">
                      {videoProgress >= 75 ? (
                        <p className="text-yellow-600">
                          🎯 <strong>Almost there!</strong> Watch {90 - Math.round(videoProgress)}% more to unlock the activity.
                        </p>
                      ) : videoProgress >= 50 ? (
                        <p className="text-blue-600">
                          👍 <strong>Halfway done!</strong> Keep watching to unlock the activity.
                        </p>
                      ) : videoProgress >= 25 ? (
                        <p className="text-blue-600">
                          📺 <strong>Good progress!</strong> Continue watching to reach 90%.
                        </p>
                      ) : (
                        <p className="text-gray-600">
                          ▶️ <strong>Watch 90% of the video</strong> to unlock the activity.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'activity' && (
          <div className="space-y-6">
            {!activityUnlocked && !videoWatched && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center gap-2 text-red-800 mb-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Activity Locked</span>
                </div>
                <p className="text-sm text-red-700">
                  You need to watch at least 90% of the video to unlock this activity.
                  Current progress: <strong>{Math.round(videoProgress)}%</strong>
                </p>
                <button
                  onClick={() => setCurrentStep('video')}
                  className="mt-2 bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded text-sm transition-colors"
                >
                  ← Go back to video
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