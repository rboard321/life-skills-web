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
  const [watchTime, setWatchTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const unitProgress = getUnitProgress(unitId);

  useEffect(() => {
    if (unitProgress?.videoCompleted) {
      setIsCompleted(true);
      onCompleted();
    }
  }, [unitProgress, onCompleted]);

  useEffect(() => {
    const startTime = Date.now();
    let lastTime = startTime;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTime) / 1000;
      lastTime = now;

      setWatchTime(prev => {
        const newWatchTime = prev + elapsed;

        const estimatedDuration = duration || 300;
        setDuration(estimatedDuration);

        if (Math.floor(newWatchTime) % 10 === 0) {
          markVideoCompleted(unitId, newWatchTime, estimatedDuration);
        }

        if (newWatchTime >= estimatedDuration * 0.9 && !isCompleted) {
          setIsCompleted(true);
          onCompleted();
          markVideoCompleted(unitId, newWatchTime, estimatedDuration);
        }

        return newWatchTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (watchTime > 0) {
        markVideoCompleted(unitId, watchTime, duration);
      }
    };
  }, [unitId, markVideoCompleted, onCompleted, duration, isCompleted, watchTime]);

  const progress = duration > 0 ? Math.min((watchTime / duration) * 100, 100) : 0;

  return (
    <div className="video-player-container">
      <div className="relative">
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
            className={`h-full transition-all duration-500 ${
              isCompleted ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Progress: {progress.toFixed(1)}%</span>
          <span>
            {isCompleted ? (
              <span className="text-green-600 font-semibold">✓ Completed</span>
            ) : (
              `${Math.floor(watchTime / 60)}:${(Math.floor(watchTime) % 60)
                .toString()
                .padStart(2, '0')} watched`
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
