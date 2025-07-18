import { useState } from 'react';
import type {Unit} from '../data/sampleUnits';
import VideoPlayer from './VideoPlayer';
import ActivityEmbed from './ActivityEmbed';

const UnitPage: React.FC<{ unit: Unit }> = ({ unit }) => {
    const [videoWatched, setVideoWatched] = useState(false);

    return (
        <div style={{ padding: '2rem' }}>
            <h1>{unit.title}</h1>
            <VideoPlayer url={unit.videoUrl} onWatched={() => setVideoWatched(true)} />
            {videoWatched && unit.activities.map(a => (
                <ActivityEmbed key={a.id} activity={a} />
            ))}
        </div>
    );
};

export default UnitPage;
