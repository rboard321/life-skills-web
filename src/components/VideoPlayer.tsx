import React, { useRef, useEffect, useState } from 'react';
import { useProgress } from '../contexts/ProgressContext';

interface VideoPlayerProps {
  url: string;
  unitId: number;
  onCompleted: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, unitId, onCompleted }) => {
  const { markVideoCompleted, getUnitProgress } = useProgress();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [watchStartTime, setWatchStartTime] = useState<number | null>(null);
  const [totalWatchTime, setTotalWatchTime] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState(300); // default 5 min

  const unitProgress = getUnitProgress(unitId);

  useEffect(() => {
    if (unitProgress?.videoCompleted) {
      setIsCompleted(true);
      onCompleted();
    }
    if (unitProgress?.videoWatchTime) {
      setTotalWatchTime(unitProgress.videoWatchTime);
    }
    if (unitProgress?.videoDuration && unitProgress.videoDuration > 0) {
      setEstimatedDuration(unitProgress.videoDuration);
    }
  }, [unitProgress, onCompleted]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);

        if (entry.isIntersecting && !isCompleted) {
          setWatchStartTime(Date.now());
        } else if (!entry.isIntersecting && watchStartTime) {
          const timeWatched = (Date.now() - watchStartTime) / 1000;
          const newTotal = totalWatchTime + timeWatched;
          setTotalWatchTime(newTotal);
          setWatchStartTime(null);
          markVideoCompleted(unitId, newTotal, estimatedDuration);
        }
      },
      { threshold: 0.5 }
    );

    if (iframeRef.current) {
      observer.observe(iframeRef.current);
    }

    return () => {
      observer.disconnect();
      if (watchStartTime) {
        const timeWatched = (Date.now() - watchStartTime) / 1000;
        const finalWatchTime = totalWatchTime + timeWatched;
        markVideoCompleted(unitId, finalWatchTime, estimatedDuration);
      }
    };
  }, [watchStartTime, totalWatchTime, unitId, markVideoCompleted, isCompleted, estimatedDuration]);

  const handleVideoComplete = React.useCallback(() => {
    if (!isCompleted) {
      setIsCompleted(true);
      onCompleted();

      const finalTime = watchStartTime
        ? totalWatchTime + (Date.now() - watchStartTime) / 1000
        : totalWatchTime;
      markVideoCompleted(unitId, finalTime, estimatedDuration);
    }
  }, [isCompleted, onCompleted, watchStartTime, totalWatchTime, unitId, markVideoCompleted, estimatedDuration]);

  useEffect(() => {
    if (!isVisible || !watchStartTime || isCompleted) return;

    const interval = setInterval(() => {
      const currentSessionTime = (Date.now() - (watchStartTime ?? 0)) / 1000;
      const currentTotalTime = totalWatchTime + currentSessionTime;

      markVideoCompleted(unitId, currentTotalTime, estimatedDuration);

      if (currentTotalTime >= estimatedDuration * 0.85) {
        handleVideoComplete();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isVisible, watchStartTime, totalWatchTime, unitId, markVideoCompleted, estimatedDuration, isCompleted, handleVideoComplete]);

  const getCurrentWatchTime = () => {
    if (watchStartTime) {
      return totalWatchTime + (Date.now() - watchStartTime) / 1000;
    }
    return totalWatchTime;
  };

  const progress = Math.min((getCurrentWatchTime() / estimatedDuration) * 100, 100);

  const showResumeIndicator =
    !!unitProgress?.videoWatchTime && unitProgress.videoWatchTime > 30 && !isCompleted;

  return (
    <div className="video-player-container">
      <div className="relative">
        {showResumeIndicator && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Resume watching</p>
                <p className="text-xs text-blue-700">
                  You were at {Math.floor(unitProgress!.videoWatchTime / 60)}:
                  {(Math.floor(unitProgress!.videoWatchTime) % 60).toString().padStart(2, '0')}
                </p>
              </div>
              <div className="text-2xl">📍</div>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          width="100%"
          height="400"
          src={url}
          title={`Unit ${unitId} Video`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="rounded-lg shadow-lg"
        />

        <div className="mt-4 bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Progress: {progress.toFixed(1)}%</span>
          <div className="flex items-center space-x-4">
            <span
              className={`px-2 py-1 rounded text-xs ${isVisible ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            >
              {isVisible ? '👁 Watching' : '💤 Away'}
            </span>
            <span>
              {isCompleted ? (
                <span className="text-green-600 font-semibold">✓ Completed</span>
              ) : (
                `${Math.floor(getCurrentWatchTime() / 60)}:${(Math.floor(getCurrentWatchTime()) % 60)
                  .toString()
                  .padStart(2, '0')} watched`
              )}
            </span>
          </div>
        </div>

        {!isCompleted && progress > 60 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              Watched most of the video? You can mark it as complete.
            </p>
            <button
              onClick={handleVideoComplete}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Mark Video as Complete
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <span className="text-green-700 font-medium">
              🎉 Video completed! You can now access the activities below.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
