import React, { useRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as unknown as React.ComponentType<any>;
import { useProgress } from '../contexts/ProgressContext';

interface VideoPlayerProps {
  url: string;
  captionsUrl?: string;
  unitId: number;
  lessonId: number;
  onCompleted: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  captionsUrl,
  unitId,
  lessonId,
  onCompleted
}) => {
  const { markLessonVideoCompleted, getUnitProgress } = useProgress();
  const playerRef = useRef<any>(null);
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);

  const unitProgress = getUnitProgress(unitId);
  const lessonProgress = unitProgress?.lessonsProgress[lessonId];

  useEffect(() => {
    if (lessonProgress?.videoCompleted) {
      setIsCompleted(true);
      onCompleted();
    }
    if (lessonProgress?.videoWatchTime) {
      setPlayedSeconds(lessonProgress.videoWatchTime);
    }
    if (lessonProgress?.videoDuration && lessonProgress.videoDuration > 0) {
      setDuration(lessonProgress.videoDuration);
    }
  }, [lessonProgress, onCompleted]);

  useEffect(() => {
    if (captionsUrl) {
      fetch(captionsUrl)
        .then(res => res.text())
        .then(text => {
          const lines = text
            .split('\n')
            .filter(line => line && !/^\d+$/.test(line) && !line.includes('-->'));
          setTranscript(lines);
        })
        .catch(() => {
          /* ignore fetch errors */
        });
    }
  }, [captionsUrl]);

  useEffect(() => {
    if (playedSeconds > 0 && playerRef.current && !isCompleted) {
      playerRef.current.seekTo(playedSeconds, 'seconds');
    }
  }, [playedSeconds, isCompleted]);

  const handleProgress = (state: any) => {
    setPlayedSeconds(state.playedSeconds);
    if (duration > 0) {
      markLessonVideoCompleted(unitId, lessonId, state.playedSeconds, duration);
      if (state.playedSeconds >= duration * 0.85 && !isCompleted) {
        setIsCompleted(true);
        onCompleted();
      }
    }
  };

  const handleDuration = (d: number) => setDuration(d);

  useEffect(() => {
    return () => {
      if (duration > 0) {
        markLessonVideoCompleted(unitId, lessonId, playedSeconds, duration);
      }
    };
  }, [duration, playedSeconds, unitId, lessonId, markLessonVideoCompleted]);

  const progress = duration > 0 ? Math.min((playedSeconds / duration) * 100, 100) : 0;

  const showResumeIndicator =
    !!lessonProgress?.videoWatchTime && lessonProgress.videoWatchTime > 30 && !isCompleted;

  return (
    <div className="video-player-container space-y-4">
      {showResumeIndicator && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Resume watching</p>
              <p className="text-xs text-blue-700">
                You were at {Math.floor(lessonProgress!.videoWatchTime / 60)}:
                {(Math.floor(lessonProgress!.videoWatchTime) % 60).toString().padStart(2, '0')}
              </p>
            </div>
            <div className="text-2xl">📍</div>
          </div>
        </div>
      )}

      <Player
        ref={playerRef}
        src={url}
        controls
        onProgress={handleProgress}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        onDurationChange={handleDuration}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config={
          (captionsUrl
            ? { file: { tracks: [{ kind: 'subtitles', src: captionsUrl, srcLang: 'en', default: true }] } }
            : undefined) as any
        }
        width="100%"
        height="400px"
      />

      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Progress: {progress.toFixed(1)}%</span>
        <span>
          {isCompleted ? (
            <span className="text-green-600 font-semibold">✓ Completed</span>
          ) : (
            `${Math.floor(playedSeconds / 60)}:${Math.floor(playedSeconds % 60)
              .toString()
              .padStart(2, '0')} watched`
          )}
        </span>
      </div>
      {transcript.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
          {transcript.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
