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
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [player, setPlayer] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [_watchedSeconds, setWatchedSeconds] = useState(0);
  const [percentWatched, setPercentWatched] = useState(currentProgress);
  const [hasReached90, setHasReached90] = useState(currentProgress >= 90);
  const [_isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isAPILoaded, setIsAPILoaded] = useState(false);

  // Extract video ID from YouTube URL
  const extractVideoId = useCallback((videoUrl: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = videoUrl.match(regex);
    return match ? match[1] : null;
  }, []);

  const videoId = extractVideoId(url);

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
        origin: window.location.origin
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
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            startProgressTracking();
          } else {
            setIsPlaying(false);
            stopProgressTracking();
          }
        },
        onError: () => {
          setHasError(true);
        }
      }
    });

    playerRef.current = newPlayer;

    return () => {
      stopProgressTracking();
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isAPILoaded, videoId, currentProgress]);

  // Progress tracking
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) return;

    progressIntervalRef.current = setInterval(() => {
      if (player && duration > 0) {
        const currentTime = player.getCurrentTime();
        const percent = Math.min(100, (currentTime / duration) * 100);

        setWatchedSeconds(currentTime);
        setPercentWatched(percent);

        // Check if reached 90%
        if (percent >= 90 && !hasReached90) {
          setHasReached90(true);
          if (onVideoComplete) {
            onVideoComplete();
          }
        }

        // Call progress update callback
        if (onProgressUpdate) {
          onProgressUpdate(currentTime, duration, percent);
        }

        // Debug logging
        console.log('Video Progress:', {
          currentTime: Math.round(currentTime),
          duration: Math.round(duration),
          percent: Math.round(percent),
          hasReached90
        });
      }
    }, 2000); // Update every 2 seconds
  }, [player, duration, hasReached90, onVideoComplete, onProgressUpdate]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Manual complete handler
  const handleManualComplete = () => {
    setHasReached90(true);
    setPercentWatched(100);
    if (onVideoComplete) {
      onVideoComplete();
    }
  };

  // Progress bar color based on percentage
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
    if (percentWatched >= 75) {
      return '🎯 Almost there! Keep watching to unlock the activity.';
    }
    if (percentWatched >= 50) {
      return '👍 Halfway done! Continue watching.';
    }
    if (percentWatched >= 25) {
      return '▶️ Good progress! Keep going.';
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

      {/* Manual Complete Button (Backup) */}
      {canMarkComplete && !isCompleted && !hasReached90 && percentWatched >= 25 && (
        <div className="pt-4 border-t">
          <button
            onClick={handleManualComplete}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
          >
            ✓ Mark as Watched (Manual Override)
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Use this if the video isn't tracking properly
          </p>
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