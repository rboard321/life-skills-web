import React from 'react';
import { optimizeYouTubeUrl } from '../utils/youtube';

interface BasicVideoPlayerProps {
  url: string;
  title: string;
}

const BasicVideoPlayer: React.FC<BasicVideoPlayerProps> = ({ url, title }) => {
  const embedUrl = optimizeYouTubeUrl(url);

  return (
    <div className="space-y-4">
      {/* Video Title */}
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      )}

      {/* Video Player */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          title={title}
          width="100%"
          height="100%"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default BasicVideoPlayer;