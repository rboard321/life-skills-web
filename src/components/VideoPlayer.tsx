import * as React from "react";

type Props = {
    url: string;
    onWatched: () => void;
};

const VideoPlayer: React.FC<Props> = ({ url, onWatched }) => {
    // Simulate "watched" event after 1 second
    React.useEffect(() => {
        const timer = setTimeout(onWatched, 1000);
        return () => clearTimeout(timer);
    }, [onWatched]);

    return (
        <iframe
            width="100%"
            height="400"
            src={url}
            title="Unit Video"
            allow="autoplay; encrypted-media"
            allowFullScreen
        />
    );
};

export default VideoPlayer;
