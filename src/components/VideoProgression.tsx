import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { Link } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Player = ReactPlayer as unknown as React.ComponentType<any>;

interface Activity {
  id: number;
  type: 'h5p' | 'wordwall';
  url: string;
  title?: string;
}

interface VideoProgressionProps {
  videoUrl: string;
  captionsUrl?: string;
  activities: Activity[];
  nextLessonUrl?: string;
  nextLessonTitle?: string;
  backToUnitUrl: string;
  lessonTitle: string;
}

const VideoProgression: React.FC<VideoProgressionProps> = ({
  videoUrl,
  captionsUrl,
  activities,
  nextLessonUrl,
  nextLessonTitle,
  backToUnitUrl,
  lessonTitle
}) => {
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [completedActivities, setCompletedActivities] = useState<Set<number>>(() => new Set());
  const [showingVideo, setShowingVideo] = useState(true);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  const [duration, setDuration] = useState(0);
  const [, setWatchedSeconds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    console.debug('[VideoProgression] Video URL updated', { videoUrl });
  }, [videoUrl]);

  useEffect(() => {
    if (duration > 0) {
      console.debug('[VideoProgression] Video duration detected', { duration });
    }
  }, [duration]);

  useEffect(() => {
    if (videoReady) {
      console.debug('[VideoProgression] Video ready for playback', { videoUrl });
    }
  }, [videoReady, videoUrl]);

  useEffect(() => {
    if (videoError) {
      console.error('[VideoProgression] Video error state', { videoError, videoUrl });
    }
  }, [videoError, videoUrl]);

  useEffect(() => {
    if (videoCompleted) {
      console.debug('[VideoProgression] Video marked as complete');
    }
  }, [videoCompleted]);

  const totalSteps = 1 + activities.length;
  const completedSteps = (videoCompleted ? 1 : 0) + completedActivities.size;
  const overallProgress = (completedSteps / totalSteps) * 100;
  const allActivitiesCompleted = completedActivities.size === activities.length;
  const lessonFullyCompleted = videoCompleted && allActivitiesCompleted;

  const handleProgress = (state: { playedSeconds: number }) => {
    try {
      const currentSecond = Math.floor(state.playedSeconds);

      setWatchedSeconds(prevSeconds => {
        const updatedSeconds = new Set(prevSeconds);
        updatedSeconds.add(currentSecond);

        if (duration > 0) {
          const totalDurationSeconds = Math.max(1, Math.floor(duration));
          const percentage = (updatedSeconds.size / totalDurationSeconds) * 100;
          const clampedPercentage = Math.min(percentage, 100);
          setWatchedPercentage(clampedPercentage);

          if (clampedPercentage >= 80 && !videoCompleted) {
            setVideoCompleted(true);
          }
        }

        return updatedSeconds;
      });
    } catch (error) {
      console.error('Error tracking video progress:', error);
    }
  };

  const handleDuration = (value: number) => {
    try {
      setDuration(value);
      setVideoError(null);
    } catch (error) {
      console.error('Error setting video duration:', error);
    }
  };

  const handleVideoEnd = () => {
    try {
      setVideoCompleted(true);
    } catch (error) {
      console.error('Error handling video end:', error);
    }
  };

  const handleVideoReady = () => {
    try {
      setVideoReady(true);
      setVideoError(null);
    } catch (error) {
      console.error('Error handling video ready:', error);
    }
  };

  const handleVideoError = (error: unknown) => {
    console.error('Video playback error:', error);
    setVideoError('Unable to load video. Please check your internet connection or try refreshing the page.');
  };

  const handleActivityComplete = () => {
    try {
      const currentActivity = activities[currentActivityIndex];
      if (currentActivity) {
        setCompletedActivities(prevActivities => {
          const updatedActivities = new Set(prevActivities);
          updatedActivities.add(currentActivity.id);
          return updatedActivities;
        });
      }
    } catch (error) {
      console.error('Error completing activity:', error);
    }
  };

  const goToNextActivity = () => {
    try {
      if (currentActivityIndex < activities.length - 1) {
        setCurrentActivityIndex(prevIndex => prevIndex + 1);
      }
    } catch (error) {
      console.error('Error navigating to next activity:', error);
    }
  };

  const goToPreviousActivity = () => {
    try {
      if (currentActivityIndex > 0) {
        setCurrentActivityIndex(prevIndex => prevIndex - 1);
      }
    } catch (error) {
      console.error('Error navigating to previous activity:', error);
    }
  };

  const currentActivity = activities[currentActivityIndex];
  const isCurrentActivityCompleted = currentActivity ? completedActivities.has(currentActivity.id) : false;

  if (activities.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{lessonTitle}</h1>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Activities Available</h3>
          <p className="text-yellow-600 mb-4">This lesson doesn't have any activities yet.</p>
          <Link to={backToUnitUrl} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Back to Unit
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{lessonTitle}</h1>
      </div>

      <div className="mb-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Lesson Progress</h3>
          <span className="text-sm text-gray-600">
            {completedSteps}/{totalSteps} completed
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div className="bg-blue-500 h-3 rounded-full transition-all duration-300" style={{ width: `${overallProgress}%` }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mr-2 ${
                videoCompleted ? 'bg-green-500' : 'bg-gray-400'
              }`}
            >
              {videoCompleted ? '✓' : '1'}
            </span>
            <span className={videoCompleted ? 'text-green-600 font-medium' : ''}>
              Video {videoCompleted ? 'Complete' : `(${Math.round(watchedPercentage)}% watched)`}
            </span>
          </div>

          <div className="flex items-center">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mr-2 ${
                allActivitiesCompleted ? 'bg-green-500' : 'bg-gray-400'
              }`}
            >
              {allActivitiesCompleted ? '✓' : '2'}
            </span>
            <span className={allActivitiesCompleted ? 'text-green-600 font-medium' : ''}>
              Activities ({completedActivities.size}/{activities.length})
            </span>
          </div>

          <div className="flex items-center">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mr-2 ${
                lessonFullyCompleted ? 'bg-green-500' : 'bg-gray-400'
              }`}
            >
              {lessonFullyCompleted ? '✓' : '3'}
            </span>
            <span className={lessonFullyCompleted ? 'text-green-600 font-medium' : ''}>Lesson Complete</span>
          </div>
        </div>
      </div>

      {showingVideo && (
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Step 1: Watch the Video</h2>
            {videoCompleted && (
              <button
                onClick={() => setShowingVideo(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Go to Activities →
              </button>
            )}
          </div>

          {videoError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Video Loading Error</h3>
              <p className="text-red-600 text-sm mb-4">{videoError}</p>
              <button
                onClick={() => {
                  setVideoError(null);
                  setVideoReady(false);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {!videoReady && (
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg mb-4">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading video...</p>
                  </div>
                </div>
              )}

              <Player
                url={videoUrl}
                controls
                width="100%"
                height="400px"
                onProgress={handleProgress}
                onDuration={handleDuration}
                onEnded={handleVideoEnd}
                onReady={handleVideoReady}
                onError={handleVideoError}
                config={
                  captionsUrl
                    ? {
                        file: {
                          tracks: [
                            {
                              kind: 'subtitles',
                              src: captionsUrl,
                              srcLang: 'en',
                              default: true
                            }
                          ]
                        }
                      }
                    : undefined
                }
                className="rounded-lg overflow-hidden"
                style={{ display: videoReady ? 'block' : 'none' }}
              />
            </>
          )}

          {!videoError && (
            <div className="mt-4">
              {videoCompleted ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-green-500 text-xl mr-2">✅</span>
                    <div>
                      <h3 className="font-semibold text-green-800">Video Complete!</h3>
                      <p className="text-green-600 text-sm">You can now access the activities.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-800">Keep Watching</h3>
                      <p className="text-blue-600 text-sm">Watch at least 80% of the video to unlock activities</p>
                    </div>
                    <div className="text-blue-600 font-medium">{Math.round(watchedPercentage)}% / 80%</div>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(watchedPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!showingVideo && videoCompleted && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              Step 2: Activity {currentActivityIndex + 1} of {activities.length}
            </h2>
            <button
              onClick={() => setShowingVideo(true)}
              className="text-blue-600 hover:text-blue-800 text-sm border border-blue-300 px-3 py-1 rounded"
            >
              ← Back to Video
            </button>
          </div>

          {currentActivity && (
            <>
              <h3 className="text-lg font-medium mb-4">{currentActivity.title || `Activity ${currentActivityIndex + 1}`}</h3>

              <div className="mb-6 border rounded-lg overflow-hidden">
                <iframe
                  src={currentActivity.url}
                  width="100%"
                  height="500"
                  title={currentActivity.title || `Activity ${currentActivityIndex + 1}`}
                  allowFullScreen
                  className="border-0"
                  onError={event => {
                    console.error('Activity iframe error:', event);
                  }}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex space-x-3">
                  <button
                    onClick={goToPreviousActivity}
                    disabled={currentActivityIndex === 0}
                    className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    ← Previous Activity
                  </button>

                  <button
                    onClick={handleActivityComplete}
                    disabled={isCurrentActivityCompleted}
                    className={`px-4 py-2 rounded transition-colors ${
                      isCurrentActivityCompleted
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isCurrentActivityCompleted ? 'Completed ✓' : 'Mark as Complete'}
                  </button>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={goToNextActivity}
                    disabled={currentActivityIndex === activities.length - 1 || !isCurrentActivityCompleted}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next Activity →
                  </button>
                </div>
              </div>

              <div className="mt-4 text-center">
                <div className="flex justify-center space-x-2">
                  {activities.map((activity, index) => (
                    <button
                      key={activity.id}
                      onClick={() => setCurrentActivityIndex(index)}
                      className={`w-8 h-8 rounded-full text-sm transition-colors ${
                        index === currentActivityIndex
                          ? 'bg-blue-600 text-white'
                          : completedActivities.has(activity.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {completedActivities.has(activity.id) ? '✓' : index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {lessonFullyCompleted && (
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-green-900 mb-2">Congratulations! Lesson Complete!</h3>
          <p className="text-green-700 mb-6">You've successfully watched the video and completed all activities.</p>

          <div className="flex justify-center space-x-4">
            <Link to={backToUnitUrl} className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
              ← Back to Unit
            </Link>

            {nextLessonUrl && (
              <Link to={nextLessonUrl} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Next: {nextLessonTitle} →
              </Link>
            )}
          </div>
        </div>
      )}

      {!lessonFullyCompleted && (
        <div className="mt-8 flex justify-between">
          <Link
            to={backToUnitUrl}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Back to Unit
          </Link>

          {nextLessonUrl && videoCompleted && allActivitiesCompleted && (
            <Link
              to={nextLessonUrl}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
            >
              Next: {nextLessonTitle} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoProgression;
