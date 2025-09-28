import React, { useState, useCallback } from 'react';
import ReactPlayer from 'react-player';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Player = ReactPlayer as unknown as React.ComponentType<any>;

interface SimpleVideoPlayerProps {
  url: string;
  title: string;
  onVideoWatched?: () => void;
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  url,
  title,
  onVideoWatched,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);

  const handleReady = useCallback(() => {
    console.log('🎬 Video ready:', title);
    console.log('🎬 Video URL:', url);
    setIsReady(true);
    setHasError(false);
  }, [title, url]);

  const handleError = useCallback((error: unknown) => {
    console.error('❌ Video error:', error);
    console.error('❌ Failed URL:', url);
    setHasError(true);
    setIsReady(false);
  }, [url]);

  const handleVideoEnd = useCallback(() => {
    console.log('🏁 Video ended');
    setHasWatched(true);
    if (onVideoWatched) {
      onVideoWatched();
    }
  }, [onVideoWatched]);

  const handleMarkWatched = useCallback(() => {
    console.log('✅ Manually marked as watched');
    setHasWatched(true);
    if (onVideoWatched) {
      onVideoWatched();
    }
  }, [onVideoWatched]);

  if (hasError) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Cannot Be Loaded</h3>
            <p className="text-gray-600 mb-2">
              Please check that the video URL is correct and the video is public.
            </p>
            <p className="text-sm text-gray-500 mb-4 font-mono bg-gray-50 p-2 rounded">
              URL: {url}
            </p>
            <div className="space-x-2">
              <button
                onClick={() => window.open(url, '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Open in YouTube
              </button>
              <button
                onClick={() => {
                  setHasError(false);
                  setIsReady(false);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Retry
              </button>
            </div>
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
          url={url}
          width="100%"
          height="100%"
          controls
          onReady={handleReady}
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
        {hasWatched && (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            ✓ Watched
          </div>
        )}

        {/* Loading overlay */}
        {!isReady && !hasError && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Loading video...</p>
            </div>
          </div>
        )}
      </div>

      {/* Manual completion button */}
      {isReady && !hasWatched && (
        <div className="text-center">
          <button
            onClick={handleMarkWatched}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            ✓ Mark as Watched
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Click this when you've finished watching the video
          </p>
        </div>
      )}

      {/* Watched confirmation */}
      {hasWatched && (
        <div className="text-center">
          <p className="text-green-600 font-medium">
            ✓ Great job! You can now continue to the activity.
          </p>
        </div>
      )}
    </div>
  );
};

export default SimpleVideoPlayer;