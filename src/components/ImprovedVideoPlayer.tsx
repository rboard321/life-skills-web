import React, { useState, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';

interface ImprovedVideoPlayerProps {
  url: string;
  title: string;
  onProgress?: (progress: { watched: number; duration: number; percent: number }) => void;
  onVideoComplete?: () => void;
  canMarkComplete?: boolean;
  isCompleted?: boolean;
  allowRewatch?: boolean;
  onVideoProgressUpdate?: (watchedSeconds: number, totalSeconds: number) => void;
}

const ImprovedVideoPlayer: React.FC<ImprovedVideoPlayerProps> = ({
  url,
  title: _title,
  onProgress,
  onVideoComplete,
  canMarkComplete = false,
  isCompleted = false,
  allowRewatch = true,
  onVideoProgressUpdate
}) => {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [watchedPercent, setWatchedPercent] = useState(0);
  const [hasWatched90Percent, setHasWatched90Percent] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const playerRef = useRef<any>(null);
  const watchedSegments = useRef(new Set<number>());

  const handleProgress = useCallback((state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    if (!playerReady || !duration) return;

    const currentSecond = Math.floor(state.playedSeconds);
    watchedSegments.current.add(currentSecond);

    const totalWatchedSeconds = watchedSegments.current.size;
    const percentWatched = Math.min((totalWatchedSeconds / duration) * 100, 100);

    setWatchedSeconds(totalWatchedSeconds);
    setWatchedPercent(percentWatched);

    // Check if user has watched 90% of the video
    if (percentWatched >= 90 && !hasWatched90Percent) {
      setHasWatched90Percent(true);
    }

    // Call parent progress callback
    onProgress?.({
      watched: totalWatchedSeconds,
      duration,
      percent: percentWatched
    });

    // Update Firebase progress tracking
    onVideoProgressUpdate?.(totalWatchedSeconds, duration);
  }, [duration, hasWatched90Percent, onProgress, onVideoProgressUpdate, playerReady]);

  const handleDuration = useCallback((duration: number) => {
    setDuration(duration);
  }, []);

  const handleReady = useCallback(() => {
    setPlayerReady(true);
    setHasError(false);
    setErrorMessage('');
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('Video player error:', error);
    setHasError(true);
    setErrorMessage('This video cannot be embedded. It may be private, restricted, or have embedding disabled.');
  }, []);

  const handleMarkComplete = () => {
    if (hasWatched90Percent && onVideoComplete) {
      onVideoComplete();
    }
  };

  const getProgressColor = () => {
    if (watchedPercent >= 90) return 'bg-green-500';
    if (watchedPercent >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getProgressMessage = () => {
    if (isCompleted) {
      return '✅ Video completed! You can rewatch anytime.';
    }
    if (watchedPercent >= 90) {
      return '🎉 Great! You\'ve watched enough to continue.';
    }
    if (watchedPercent >= 50) {
      return '👍 Keep watching to unlock the activity.';
    }
    return '▶️ Watch the video to unlock the activity.';
  };

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
{!hasError ? (
          React.createElement(ReactPlayer as any, {
            ref: playerRef,
            url: url,
            width: "100%",
            height: "100%",
            playing: playing,
            controls: true,
            onProgress: handleProgress,
            onDuration: handleDuration,
            onReady: handleReady,
            onError: handleError,
            onPlay: () => setPlaying(true),
            onPause: () => setPlaying(false),
            progressInterval: 1000,
            config: {
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                  fs: 1,
                  cc_load_policy: 1,
                  iv_load_policy: 3,
                  enablejsapi: 1
                }
              }
            }
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gray-100 text-center p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Cannot Be Played</h3>
            <p className="text-gray-600 mb-4 max-w-md">{errorMessage}</p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>This usually happens when:</p>
              <ul className="list-disc list-inside space-y-1 text-left">
                <li>The video has embedding disabled</li>
                <li>The video is private or restricted</li>
                <li>The video has been removed</li>
              </ul>
            </div>
            <button
              onClick={() => window.open(url.replace('/embed/', '/watch?v=').split('?')[0], '_blank')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Opening in YouTube
            </button>
          </div>
        )}

        {/* Video completion overlay */}
        {isCompleted && (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            ✓ Completed
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-gray-700">Progress</span>
          <span className="text-gray-600">
            {Math.round(watchedPercent)}% watched
            {duration > 0 && (
              <span className="ml-2 text-gray-400">
                ({Math.round(watchedSeconds)}s / {Math.round(duration)}s)
              </span>
            )}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(watchedPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Progress Message */}
      <div className={`p-3 rounded-md text-sm ${
        isCompleted
          ? 'bg-green-50 text-green-800 border border-green-200'
          : watchedPercent >= 90
          ? 'bg-green-50 text-green-800 border border-green-200'
          : 'bg-blue-50 text-blue-800 border border-blue-200'
      }`}>
        {getProgressMessage()}
      </div>

      {/* Action Button */}
      {canMarkComplete && !isCompleted && (
        <button
          onClick={handleMarkComplete}
          disabled={!hasWatched90Percent}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            hasWatched90Percent
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {hasWatched90Percent
            ? '✓ Mark Video as Complete'
            : `Watch ${90 - Math.round(watchedPercent)}% more to continue`
          }
        </button>
      )}

      {/* Rewatch Option */}
      {isCompleted && allowRewatch && (
        <div className="text-center text-sm text-gray-600">
          <span className="mr-2">Want to review?</span>
          <button
            onClick={() => {
              if (playerRef.current && playerRef.current.seekTo) {
                playerRef.current.seekTo(0);
                setPlaying(true);
              }
            }}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Rewatch Video
          </button>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
          Debug: Watched {watchedSegments.current.size} unique seconds out of {Math.round(duration)} total
          | 90% threshold: {hasWatched90Percent ? '✓' : '✗'}
        </div>
      )}
    </div>
  );
};

export default ImprovedVideoPlayer;