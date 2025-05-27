import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const AdminPage: React.FC = () => {
    const [title, setTitle] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [activities, setActivities] = useState([{ type: 'h5p', url: '' }]);

    const handleActivityChange = (index: number, value: string) => {
        const updated = [...activities];
        updated[index].url = value;
        setActivities(updated);
    };

    const handleAddActivity = () => {
        setActivities([...activities, { type: 'h5p', url: '' }]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newUnit = {
            id: Date.now(),
            title,
            videoUrl,
            activities: activities.map((a, index) => ({
                id: index + 1,
                type: a.type,
                url: a.url,
            })),
        };

        try {
            await addDoc(collection(db, 'units'), newUnit);
            alert('Unit added!');
            setTitle('');
            setVideoUrl('');
            setActivities([{ type: 'h5p', url: '' }]);
        } catch (error) {
            console.error('Error adding unit:', error);
            alert('Failed to add unit.');
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Add New Unit</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Unit Title:</label><br />
                    <input value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div>
                    <label>Video URL:</label><br />
                    <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} required />
                </div>
                <div>
                    <h4>Activities:</h4>
                    {activities.map((activity, index) => (
                        <div key={index}>
                            <input
                                placeholder="Activity URL"
                                value={activity.url}
                                onChange={e => handleActivityChange(index, e.target.value)}
                                required
                            />
                        </div>
                    ))}
                    <button type="button" onClick={handleAddActivity}>
                        + Add Another Activity
                    </button>
                </div>
                <br />
                <button type="submit">Add Unit</button>
            </form>
        </div>
    );
};

export default AdminPage;