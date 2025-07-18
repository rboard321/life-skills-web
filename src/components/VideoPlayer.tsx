import React, { useEffect, useRef, useState } from 'react';
import { useProgress } from '../contexts/ProgressContext';

// Extend the Window interface for the YouTube API
interface YTPlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface YTNamespace {
  Player: new (container: HTMLDivElement, options: unknown) => YTPlayer;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

declare global {
  interface Window {
    YT: YTNamespace;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPlayerProps {
  url: string;
  unitId: number;
  onCompleted: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, unitId, onCompleted }) => {
  const { markVideoCompleted, getUnitProgress } = useProgress();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [watchTime, setWatchTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const unitProgress = getUnitProgress(unitId);

  // Extract the video ID from a variety of YouTube URL formats
  const getVideoId = (videoUrl: string) => {
    const patterns = [
      /(?:youtube\.com\/embed\/)([^?&"'>]+)/,
      /(?:youtube\.com\/watch\?v=)([^?&"'>]+)/,
      /(?:youtu\.be\/)([^?&"'>]+)/,
      /(?:youtube\.com\/v\/)([^?&"'>]+)/,
    ];

    for (const pattern of patterns) {
      const match = videoUrl.match(pattern);
      if (match) return match[1];
    }

    console.warn('Could not extract video ID from URL:', videoUrl);
    return null;
  };

  const videoId = getVideoId(url);

  useEffect(() => {
    if (unitProgress?.videoCompleted) {
      setIsCompleted(true);
      onCompleted();
    }
  }, [unitProgress, onCompleted]);

  useEffect(() => {
    if (!videoId) return;

    // Load the YouTube IFrame API if it hasn't been loaded yet
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const initializePlayer = () => {
    if (!containerRef.current || !videoId) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '400',
      width: '100%',
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  };

  const onPlayerReady = (event: YTPlayerEvent) => {
    const videoDuration = event.target.getDuration();
    setDuration(videoDuration);

    if (unitProgress?.videoWatchTime && unitProgress.videoWatchTime > 10) {
      const resumeTime = Math.min(unitProgress.videoWatchTime, videoDuration - 30);
      event.target.seekTo(resumeTime, true);
      setWatchTime(resumeTime);
    }
  };

  const onPlayerStateChange = (event: YTPlayerEvent) => {
    const state = event.data;
    // 1 = playing, 0 = ended, 2 = paused, etc.
    if (state === 1) {
      setIsPlaying(true);
      startTracking();
    } else {
      setIsPlaying(false);
      stopTracking();
    }

    if (state === 0) {
      handleVideoComplete();
    }
  };

  const startTracking = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const currentTime = playerRef.current.getCurrentTime();
        setWatchTime(currentTime);

        if (Math.floor(currentTime) % 15 === 0 && currentTime > 0) {
          markVideoCompleted(unitId, currentTime, duration);
        }

        if (currentTime >= duration * 0.95 && duration > 0 && !isCompleted) {
          handleVideoComplete();
        }
      }
    }, 1000);
  };

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleVideoComplete = () => {
    if (!isCompleted) {
      setIsCompleted(true);
      onCompleted();
      markVideoCompleted(unitId, watchTime, duration);
      stopTracking();
    }
  };

  const progress = duration > 0 ? Math.min((watchTime / duration) * 100, 100) : 0;

  if (!videoId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Invalid YouTube URL. Please check the video link.</p>
      </div>
    );
  }

  return (
    <div className="video-player-container">
      <div className="relative">
        <div ref={containerRef} className="w-full h-96 bg-black rounded-lg" />

        {unitProgress?.videoWatchTime && unitProgress.videoWatchTime > 10 && !isCompleted && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            📍 Resuming from {Math.floor(unitProgress.videoWatchTime / 60)}:{(Math.floor(unitProgress.videoWatchTime) % 60).toString().padStart(2, '0')}
          </div>
        )}

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
          <div className="flex items-center space-x-4">
            <span
              className={`px-2 py-1 rounded text-xs ${
                isPlaying ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isPlaying ? '▶ Playing' : '⏸ Paused'}
            </span>
            <span>
              {isCompleted ? (
                <span className="text-green-600 font-semibold">✓ Completed</span>
              ) : (
                `${Math.floor(watchTime / 60)}:${(Math.floor(watchTime) % 60)
                  .toString()
                  .padStart(2, '0')} / ${Math.floor(duration / 60)}:${(Math.floor(duration) % 60)
                  .toString()
                  .padStart(2, '0')}`
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
