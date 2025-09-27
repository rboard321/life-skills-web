import React, { useRef, useEffect, useState, useCallback } from 'react';

interface YouTubeProgressPlayerProps {
  url: string;
  title: string;
  onVideoComplete?: () => void;
  onProgressUpdate?: (watchedSeconds: number, totalSeconds: number, percentWatched: number) => void;
  canMarkComplete?: boolean;
  isCompleted?: boolean;
  allowRewatch?: boolean;
  currentProgress?: number; // For resuming
}

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubeProgressPlayer: React.FC<YouTubeProgressPlayerProps> = ({
  url,
  title: _title,
  onVideoComplete,
  onProgressUpdate,
  canMarkComplete = false,
  isCompleted = false,
  allowRewatch = true,
  currentProgress = 0
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [player, setPlayer] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [totalWatchedTime, setTotalWatchedTime] = useState(0);
  const [percentWatched, setPercentWatched] = useState(currentProgress);
  const [hasReached90, setHasReached90] = useState(currentProgress >= 90);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isAPILoaded, setIsAPILoaded] = useState(false);

  // Event-based tracking state
  const [playStartTime, setPlayStartTime] = useState<number | null>(null);
  const [milestonesReached, setMilestonesReached] = useState<Set<number>>(() => {
    // Initialize milestones based on current progress
    const milestones = new Set<number>();
    if (currentProgress >= 25) milestones.add(25);
    if (currentProgress >= 50) milestones.add(50);
    if (currentProgress >= 75) milestones.add(75);
    if (currentProgress >= 90) milestones.add(90);
    return milestones;
  });
  const [_lastPosition, setLastPosition] = useState(0);

  // Extract video ID from YouTube URL
  const extractVideoId = useCallback((videoUrl: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = videoUrl.match(regex);
    return match ? match[1] : null;
  }, []);

  const videoId = extractVideoId(url);

  console.log('YouTubeProgressPlayer Debug:', {
    url,
    videoId,
    isAPILoaded,
    isReady,
    player: !!player,
    totalWatchedTime: Math.round(totalWatchedTime),
    percentWatched: Math.round(percentWatched),
    milestonesReached: Array.from(milestonesReached),
    isPlaying
  });

  // Load YouTube API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsAPILoaded(true);
      return;
    }

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
    }

    window.onYouTubeIframeAPIReady = () => {
      console.log('🎬 YouTube API loaded successfully');
      setIsAPILoaded(true);
    };
  }, []);

  // Initialize player when API is loaded
  useEffect(() => {
    console.log('Player initialization check:', {
      isAPILoaded,
      videoId,
      hasContainer: !!containerRef.current,
      hasPlayer: !!player
    });

    if (!isAPILoaded || !videoId || !containerRef.current || player) return;

    const newPlayer = new window.YT.Player(containerRef.current, {
      width: '100%',
      height: '100%',
      videoId: videoId,
      playerVars: {
        modestbranding: 1,
        rel: 0,
        fs: 1,
        cc_load_policy: 1,
        iv_load_policy: 3,
        enablejsapi: 1,
        origin: window.location.origin,
        autoplay: 0,
        controls: 1,
        showinfo: 0
      },
      events: {
        onReady: (event: any) => {
          setIsReady(true);
          setDuration(event.target.getDuration());
          setPlayer(event.target);

          // Resume from previous position if available
          if (currentProgress > 0 && currentProgress < 90) {
            const resumeTime = (currentProgress / 100) * event.target.getDuration();
            event.target.seekTo(resumeTime, true);
          }
        },
        onStateChange: (event: any) => {
          console.log('YouTube player state changed:', event.data, {
            PLAYING: window.YT.PlayerState.PLAYING,
            PAUSED: window.YT.PlayerState.PAUSED,
            ENDED: window.YT.PlayerState.ENDED,
            BUFFERING: window.YT.PlayerState.BUFFERING,
            CUED: window.YT.PlayerState.CUED
          });

          if (event.data === window.YT.PlayerState.PLAYING) {
            handlePlayStart();
          } else if (event.data === window.YT.PlayerState.PAUSED ||
                     event.data === window.YT.PlayerState.BUFFERING ||
                     event.data === window.YT.PlayerState.CUED) {
            handlePlayEnd();
          } else if (event.data === window.YT.PlayerState.ENDED) {
            handlePlayEnd(); // Capture any remaining watch time
            handleVideoEnd(); // Mark as complete
          }
        },
        onError: () => {
          setHasError(true);
        }
      }
    });

    playerRef.current = newPlayer;

    return () => {
      // Capture any remaining watch time before cleanup
      if (isPlaying && playerRef.current && playStartTime !== null) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const sessionWatchTime = Math.max(0, currentTime - playStartTime);
          const newTotalWatchTime = totalWatchedTime + sessionWatchTime;

          console.log('⚠️ Cleanup: capturing remaining watch time:', Math.round(sessionWatchTime));
          setTotalWatchedTime(newTotalWatchTime);
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      }

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isAPILoaded, videoId, currentProgress, isPlaying, playStartTime, totalWatchedTime]);

  // Event-based progress tracking
  const handlePlayStart = useCallback(() => {
    if (!playerRef.current) return;

    try {
      const currentTime = playerRef.current.getCurrentTime();
      setPlayStartTime(currentTime);
      setLastPosition(currentTime);
      setIsPlaying(true);

      console.log('▶️ Video play started at:', Math.round(currentTime), 'seconds');
    } catch (error) {
      console.error('Error getting play start time:', error);
    }
  }, []);

  const handlePlayEnd = useCallback(() => {
    if (!playerRef.current || playStartTime === null) return;

    try {
      const currentTime = playerRef.current.getCurrentTime();
      const videoDuration = playerRef.current.getDuration();

      // Calculate time watched in this play session
      const sessionWatchTime = Math.max(0, currentTime - playStartTime);
      const newTotalWatchTime = totalWatchedTime + sessionWatchTime;

      setTotalWatchedTime(newTotalWatchTime);
      setPlayStartTime(null);
      setIsPlaying(false);
      setLastPosition(currentTime);

      // Calculate progress percentage
      const percent = videoDuration > 0 ? Math.min(100, (newTotalWatchTime / videoDuration) * 100) : 0;
      setPercentWatched(percent);

      console.log('⏸️ Video paused/stopped. Session watch time:', Math.round(sessionWatchTime), 'Total watched:', Math.round(newTotalWatchTime), 'Progress:', Math.round(percent) + '%');

      // Check milestones and update database
      checkMilestonesAndUpdate(newTotalWatchTime, videoDuration, currentTime);

    } catch (error) {
      console.error('Error calculating watch time:', error);
    }
  }, [playStartTime, totalWatchedTime]);

  const checkMilestonesAndUpdate = useCallback(async (watchedTime: number, videoDuration: number, _currentPosition: number) => {
    if (!videoDuration || videoDuration <= 0) return;

    const percent = Math.min(100, (watchedTime / videoDuration) * 100);
    const milestones = [25, 50, 75, 90];

    // Check which new milestones have been reached
    const newMilestones = milestones.filter(milestone =>
      percent >= milestone && !milestonesReached.has(milestone)
    );

    if (newMilestones.length > 0) {
      console.log('🎯 New milestones reached:', newMilestones);

      // Update milestones state
      const updatedMilestones = new Set([...milestonesReached, ...newMilestones]);
      setMilestonesReached(updatedMilestones);

      // Check for 90% completion
      if (newMilestones.includes(90) && !hasReached90) {
        setHasReached90(true);
        if (onVideoComplete) {
          onVideoComplete();
        }
      }

      // Update database with progress
      if (onProgressUpdate) {
        onProgressUpdate(watchedTime, videoDuration, percent);
      }
    }
  }, [milestonesReached, hasReached90, onVideoComplete, onProgressUpdate]);

  const handleVideoEnd = useCallback(() => {
    console.log('🏁 Video ended - marking as 100% complete');

    // Mark as fully watched
    setPercentWatched(100);
    setHasReached90(true);

    if (onVideoComplete) {
      onVideoComplete();
    }

    // Final progress update
    if (onProgressUpdate && duration > 0) {
      onProgressUpdate(duration, duration, 100);
    }
  }, [duration, onVideoComplete, onProgressUpdate]);

  // Manual complete handler with enhanced progress tracking
  const handleManualComplete = () => {
    console.log('🔧 Manual completion triggered');

    // Set to 100% progress
    setHasReached90(true);
    setPercentWatched(100);
    setTotalWatchedTime(duration > 0 ? duration : 100); // Use full duration or fallback

    // Update milestones to include all
    setMilestonesReached(new Set([25, 50, 75, 90]));

    if (onVideoComplete) {
      onVideoComplete();
    }

    // Trigger final progress update with manual completion
    if (onProgressUpdate && duration > 0) {
      onProgressUpdate(duration, duration, 100);
    }
  };

  // Manual milestone trigger (for testing or backup)
  const handleManualMilestone = (milestone: number) => {
    console.log('🎯 Manual milestone triggered:', milestone + '%');

    const newMilestones = new Set([...milestonesReached]);
    newMilestones.add(milestone);
    setMilestonesReached(newMilestones);

    if (milestone >= 90) {
      setHasReached90(true);
      if (onVideoComplete) {
        onVideoComplete();
      }
    }

    // Update progress to match milestone
    const progressPercent = Math.max(percentWatched, milestone);
    setPercentWatched(progressPercent);

    if (duration > 0 && onProgressUpdate) {
      const watchedTime = (progressPercent / 100) * duration;
      onProgressUpdate(watchedTime, duration, progressPercent);
    }
  };

  // Progress bar color based on percentage
  const getProgressColor = () => {
    if (percentWatched >= 90) return 'bg-green-500';
    if (percentWatched >= 75) return 'bg-yellow-500';
    if (percentWatched >= 50) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  // Enhanced progress message with milestone tracking
  const getProgressMessage = () => {
    if (isCompleted || hasReached90) {
      return '✅ Video completed! Activity unlocked.';
    }

    const reachedMilestones = Array.from(milestonesReached).sort((a, b) => b - a);
    const nextMilestone = [25, 50, 75, 90].find(m => !milestonesReached.has(m));

    if (percentWatched >= 75) {
      return `🎯 Almost there! ${90 - Math.round(percentWatched)}% more to unlock the activity.`;
    }
    if (percentWatched >= 50) {
      return `👍 Halfway done! Next milestone: ${nextMilestone || 90}%`;
    }
    if (percentWatched >= 25) {
      return `▶️ Good progress! Next milestone: ${nextMilestone || 90}%`;
    }
    if (reachedMilestones.length > 0) {
      return `📊 Progress saved! Last milestone: ${reachedMilestones[0]}%. Keep watching!`;
    }
    return '▶️ Watch at least 90% to unlock the activity.';
  };

  if (hasError || !videoId) {
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
      {/* Video Player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

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
                className="absolute top-0 w-0.5 h-3 bg-gray-400"
                style={{ left: `${milestone}%` }}
                title={`${milestone}% milestone`}
              />
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-600 text-center">
          {getProgressMessage()}
        </div>
      </div>

      {/* Enhanced Manual Controls */}
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

          {/* Debug milestone buttons (only show if not all milestones reached) */}
          {process.env.NODE_ENV === 'development' && milestonesReached.size < 4 && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-600 mb-2">Debug: Manual Milestones</p>
              <div className="flex gap-1">
                {[25, 50, 75, 90].map(milestone => (
                  <button
                    key={milestone}
                    onClick={() => handleManualMilestone(milestone)}
                    disabled={milestonesReached.has(milestone)}
                    className={`px-2 py-1 text-xs rounded ${
                      milestonesReached.has(milestone)
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

export default YouTubeProgressPlayer;