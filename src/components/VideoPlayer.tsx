import React, { useRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasWatchedSignificantly, setHasWatchedSignificantly] = useState(false);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleProgress = (state: any) => {
    setPlayedSeconds(state.playedSeconds);

    // Check if user has watched at least 30% of the video
    if (duration > 0 && state.playedSeconds >= duration * 0.3) {
      setHasWatchedSignificantly(true);
    }
  };

  const handleDuration = (d: number) => setDuration(d);

  const handleMarkAsCompleted = async () => {
    if (!isCompleted) {
      try {
        await markLessonVideoCompleted(unitId, lessonId, playedSeconds, duration);
        setIsCompleted(true);
        onCompleted();
      } catch (error) {
        console.error('Error marking video as completed:', error);
      }
    }
  };

  const progress = duration > 0 ? Math.min((playedSeconds / duration) * 100, 100) : 0;
  const canMarkComplete = hasWatchedSignificantly || progress >= 30;

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

      <div className="relative">
        <Player
          ref={playerRef}
          src={url}
          controls
          onProgress={handleProgress}
          onDurationChange={handleDuration}
          config={
            (captionsUrl
              ? { file: { tracks: [{ kind: 'subtitles', src: captionsUrl, srcLang: 'en', default: true }] } }
              : undefined) as unknown
          }
          width="100%"
          height="400px"
        />
        
        {/* Completion overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="bg-white p-6 rounded-lg text-center max-w-sm">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Video Completed!</h3>
              <p className="text-sm text-gray-600">Activities are now unlocked below</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress Info and Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <span>Progress: {progress.toFixed(1)}%</span>
          {duration > 0 && (
            <span className="ml-4">
              {Math.floor(playedSeconds / 60)}:{Math.floor(playedSeconds % 60)
                .toString()
                .padStart(2, '0')} / {Math.floor(duration / 60)}:{Math.floor(duration % 60)
                .toString()
                .padStart(2, '0')}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {isCompleted ? (
            <span className="text-green-600 font-semibold flex items-center">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Completed
            </span>
          ) : (
            <button
              onClick={handleMarkAsCompleted}
              disabled={!canMarkComplete}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                canMarkComplete
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!canMarkComplete ? 'Watch at least 30% of the video to mark as complete' : 'Mark video as completed'}
            >
              {canMarkComplete ? 'Mark as Completed' : `Watch ${Math.ceil(30 - progress)}% more`}
            </button>
          )}
        </div>
      </div>

      {/* Help text */}
      {!isCompleted && (
        <div className="text-xs text-gray-500 text-center">
          {canMarkComplete ? 
            'You can now mark this video as completed to unlock activities' :
            'Watch at least 30% of the video to unlock the completion button'
          }
        </div>
      )}

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
          <h4 className="font-medium text-gray-700 mb-2">Transcript:</h4>
          {transcript.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
