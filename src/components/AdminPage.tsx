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
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white shadow-md rounded-lg w-full max-w-xl p-6">
                <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Add New Unit</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Unit Title:</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Video URL:</label>
                        <input
                            type="url"
                            value={videoUrl}
                            onChange={e => setVideoUrl(e.target.value)}
                            required
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Activities:</h4>
                        {activities.map((activity, index) => (
                            <div key={index} className="mb-2">
                                <input
                                    type="url"
                                    placeholder="Activity URL"
                                    value={activity.url}
                                    onChange={e => handleActivityChange(index, e.target.value)}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddActivity}
                            className="text-blue-600 hover:underline text-sm"
                        >
                            + Add Another Activity
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                    >
                        Add Unit
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminPage;