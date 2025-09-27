import React from 'react';

interface SimpleVideoPlayerProps {
  url: string;
  title: string;
  onVideoComplete?: () => void;
  canMarkComplete?: boolean;
  isCompleted?: boolean;
  allowRewatch?: boolean;
  onVideoProgressUpdate?: (watchedSeconds: number, totalSeconds: number) => void;
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  url,
  title,
  onVideoComplete,
  canMarkComplete = false,
  isCompleted = false,
  allowRewatch = true,
}) => {
  // const [hasWatched, setHasWatched] = useState(false);

  const handleMarkComplete = () => {
    if (onVideoComplete) {
      onVideoComplete();
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={url}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ width: '100%', height: '100%' }}
        />

        {/* Video completion overlay */}
        {isCompleted && (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            ✓ Completed
          </div>
        )}
      </div>

      {/* Progress and Controls */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {isCompleted ? '✅ Video completed! You can rewatch anytime.' : '▶️ Watch the video to unlock the activity.'}
          </div>
        </div>

        {/* Mark Complete Button */}
        {canMarkComplete && !isCompleted && (
          <div className="pt-4 border-t">
            <button
              onClick={handleMarkComplete}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              ✓ Mark Video as Watched
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Click this button after watching the video to unlock the activity
            </p>
          </div>
        )}

        {/* Rewatch Option */}
        {isCompleted && allowRewatch && (
          <div className="pt-2">
            <p className="text-sm text-green-600 text-center">
              ✓ Great job! You can rewatch this video anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleVideoPlayer;