import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactPlayer from 'react-player';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Player = ReactPlayer as unknown as React.ComponentType<any>;

interface ReactPlayerProgressTrackerProps {
  url: string;
  title: string;
  onVideoComplete?: () => void;
  onProgressUpdate?: (watchedSeconds: number, totalSeconds: number, percentWatched: number) => void;
  canMarkComplete?: boolean;
  isCompleted?: boolean;
  allowRewatch?: boolean;
  currentProgress?: number; // For resuming
}

const ReactPlayerProgressTracker: React.FC<ReactPlayerProgressTrackerProps> = ({
  url,
  title,
  onVideoComplete,
  onProgressUpdate,
  canMarkComplete = false,
  isCompleted = false,
  allowRewatch = true,
  currentProgress = 0
}) => {
  const playerRef = useRef<any>(null);

  const [duration, setDuration] = useState(0);
  const [percentWatched, setPercentWatched] = useState(currentProgress);
  const [hasReached90, setHasReached90] = useState(currentProgress >= 90);
  const [lastPosition, setLastPosition] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Milestone tracking - moved to constants
  const [milestonesReached, setMilestonesReached] = useState<number[]>(() => {
    // Initialize milestones based on current progress
    const milestones = [25, 50, 75, 90];
    return milestones.filter(m => currentProgress >= m);
  });

  // Load saved progress and set resume position
  useEffect(() => {
    if (currentProgress > 0 && currentProgress < 90) {
      // Calculate resume position based on current progress
      const resumePosition = duration > 0 ? (currentProgress / 100) * duration : 0;
      setLastPosition(resumePosition);
    }
  }, [currentProgress, duration]);

  // Handle when player is ready
  const handleReady = useCallback(() => {
    console.log('🎬 ReactPlayer ready, duration:', Math.round(duration));
    setIsReady(true);

    // Resume from last position if applicable
    if (lastPosition > 0 && playerRef.current) {
      console.log('⏭️ Resuming from:', Math.round(lastPosition), 'seconds');
      playerRef.current.seekTo(lastPosition, 'seconds');
    }
  }, [duration, lastPosition]);

  // Handle duration change
  const handleDuration = useCallback((duration: number) => {
    console.log('⏱️ Video duration loaded:', Math.round(duration), 'seconds');
    setDuration(duration);
  }, []);

  // Handle progress updates (called ~every 0.5s during playback)
  const handleProgress = useCallback(({ playedSeconds }: { playedSeconds: number }) => {
    if (!duration) return;

    const percent = Math.floor((playedSeconds / duration) * 100);
    setPercentWatched(percent);
    setLastPosition(playedSeconds);

    // Check for new milestones
    const milestones = [25, 50, 75, 90];
    const newMilestones = milestones.filter(m =>
      percent >= m && !milestonesReached.includes(m)
    );

    if (newMilestones.length > 0) {
      console.log('🎯 New milestones reached:', newMilestones);

      const updatedMilestones = [...milestonesReached, ...newMilestones];
      setMilestonesReached(updatedMilestones);

      // Check for 90% completion
      if (newMilestones.includes(90) && !hasReached90) {
        console.log('🚀 90% reached - unlocking activity!');
        setHasReached90(true);
        if (onVideoComplete) {
          onVideoComplete();
        }
      }

      // Update database with milestone progress
      if (onProgressUpdate) {
        onProgressUpdate(playedSeconds, duration, percent);
      }
    }
  }, [duration, milestonesReached, hasReached90, onVideoComplete, onProgressUpdate]);

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    console.log('🏁 Video ended - marking as 100% complete');

    setPercentWatched(100);
    setHasReached90(true);

    // Ensure all milestones are marked
    const milestones = [25, 50, 75, 90];
    setMilestonesReached(milestones);

    if (onVideoComplete) {
      onVideoComplete();
    }

    // Final progress update
    if (onProgressUpdate && duration > 0) {
      onProgressUpdate(duration, duration, 100);
    }
  }, [duration, onVideoComplete, onProgressUpdate]);

  // Handle player errors
  const handleError = useCallback((error: unknown) => {
    console.error('❌ ReactPlayer error:', error);
    setHasError(true);
  }, []);

  // Manual complete handler
  const handleManualComplete = useCallback(() => {
    console.log('🔧 Manual completion triggered');

    const milestones = [25, 50, 75, 90];
    setHasReached90(true);
    setPercentWatched(100);
    setMilestonesReached(milestones);

    if (onVideoComplete) {
      onVideoComplete();
    }

    if (onProgressUpdate && duration > 0) {
      onProgressUpdate(duration, duration, 100);
    }
  }, [duration, onVideoComplete, onProgressUpdate]);

  // Manual milestone trigger (for debugging)
  const handleManualMilestone = useCallback((milestone: number) => {
    console.log('🎯 Manual milestone triggered:', milestone + '%');

    if (!milestonesReached.includes(milestone)) {
      const updatedMilestones = [...milestonesReached, milestone];
      setMilestonesReached(updatedMilestones);

      if (milestone >= 90) {
        setHasReached90(true);
        if (onVideoComplete) {
          onVideoComplete();
        }
      }

      const progressPercent = Math.max(percentWatched, milestone);
      setPercentWatched(progressPercent);

      if (duration > 0 && onProgressUpdate) {
        const watchedTime = (progressPercent / 100) * duration;
        onProgressUpdate(watchedTime, duration, progressPercent);
      }
    }
  }, [milestonesReached, percentWatched, duration, onVideoComplete, onProgressUpdate]);

  // Progress bar color
  const getProgressColor = () => {
    if (percentWatched >= 90) return 'bg-green-500';
    if (percentWatched >= 75) return 'bg-yellow-500';
    if (percentWatched >= 50) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  // Progress message
  const getProgressMessage = () => {
    if (isCompleted || hasReached90) {
      return '✅ Video completed! Activity unlocked.';
    }

    const milestones = [25, 50, 75, 90];
    const nextMilestone = milestones.find(m => !milestonesReached.includes(m));

    if (percentWatched >= 75) {
      return `🎯 Almost there! ${90 - Math.round(percentWatched)}% more to unlock the activity.`;
    }
    if (percentWatched >= 50) {
      return `👍 Halfway done! Next milestone: ${nextMilestone || 90}%`;
    }
    if (percentWatched >= 25) {
      return `▶️ Good progress! Next milestone: ${nextMilestone || 90}%`;
    }
    if (milestonesReached.length > 0) {
      const lastMilestone = Math.max(...milestonesReached);
      return `📊 Progress saved! Last milestone: ${lastMilestone}%. Keep watching!`;
    }
    return '▶️ Watch at least 90% to unlock the activity.';
  };

  if (hasError) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Cannot Be Loaded</h3>
            <p className="text-gray-600 mb-4">Please check that the video URL is correct and the video is public.</p>
            <button
              onClick={() => window.open(url, '_blank')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Open in YouTube
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Title */}
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      )}

      {/* Video Player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <Player
          ref={playerRef}
          src={url}
          width="100%"
          height="100%"
          controls
          playing={false} // Don't autoplay
          onReady={handleReady}
          onDuration={handleDuration}
          onProgress={handleProgress as any}
          onEnded={handleVideoEnd}
          onError={handleError}
          config={{
            youtube: {
              cc_load_policy: 1,
              iv_load_policy: 3,
            }
          } as any}
        />

        {/* Completion overlay */}
        {(isCompleted || hasReached90) && (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            ✓ Completed
          </div>
        )}

        {/* Loading overlay */}
        {!isReady && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Loading video...</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">{Math.round(percentWatched)}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out ${getProgressColor()}`}
            style={{ width: `${percentWatched}%` }}
          />

          {/* Milestone markers */}
          <div className="relative -mt-3 h-3">
            {[25, 50, 75, 90].map(milestone => (
              <div
                key={milestone}
                className={`absolute top-0 w-0.5 h-3 ${
                  milestonesReached.includes(milestone) ? 'bg-green-600' : 'bg-gray-400'
                }`}
                style={{ left: `${milestone}%` }}
                title={`${milestone}% milestone ${milestonesReached.includes(milestone) ? '✓' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-600 text-center">
          {getProgressMessage()}
        </div>
      </div>

      {/* Manual Controls */}
      {canMarkComplete && !isCompleted && (
        <div className="pt-4 border-t space-y-3">
          {/* Main manual complete button */}
          {!hasReached90 && percentWatched >= 25 && (
            <>
              <button
                onClick={handleManualComplete}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
              >
                ✓ Mark as Watched (Manual Override)
              </button>
              <p className="text-xs text-gray-500 text-center">
                Use this if the video isn't tracking properly
              </p>
            </>
          )}

          {/* Debug milestone buttons (development only) */}
          {process.env.NODE_ENV === 'development' && milestonesReached.length < 4 && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-600 mb-2">Debug: Manual Milestones</p>
              <div className="flex gap-1">
                {[25, 50, 75, 90].map(milestone => (
                  <button
                    key={milestone}
                    onClick={() => handleManualMilestone(milestone)}
                    disabled={milestonesReached.includes(milestone)}
                    className={`px-2 py-1 text-xs rounded ${
                      milestonesReached.includes(milestone)
                        ? 'bg-green-200 text-green-800'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {milestone}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rewatch Option */}
      {(isCompleted || hasReached90) && allowRewatch && (
        <div className="pt-2">
          <p className="text-sm text-green-600 text-center">
            ✓ Great job! You can rewatch this video anytime or continue to the activity.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReactPlayerProgressTracker;