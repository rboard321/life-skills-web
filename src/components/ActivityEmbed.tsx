import type {Activity} from '../data/sampleUnits';

const ActivityEmbed: React.FC<{ activity: Activity }> = ({ activity }) => {
    return (
        <div style={{ marginTop: '20px' }}>
            <iframe
                src={activity.url}
                width="100%"
                height="400"
                title={`Activity ${activity.id}`}
                allowFullScreen
            />
        </div>
    );
};

export default ActivityEmbed;
