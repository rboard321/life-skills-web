import React, { useRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Player = ReactPlayer as unknown as React.ComponentType<any>;

interface VideoPlayerProps {
  url: string;
  captionsUrl?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, captionsUrl }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const [transcript, setTranscript] = useState<string[]>([]);

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

  return (
    <div className="space-y-4">
      <Player
        ref={playerRef}
        src={url}
        controls
        config={
          (captionsUrl
            ? { file: { tracks: [{ kind: 'subtitles', src: captionsUrl, srcLang: 'en', default: true }] } }
            : undefined) as unknown
        }
        width="100%"
        height="400px"
      />

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
