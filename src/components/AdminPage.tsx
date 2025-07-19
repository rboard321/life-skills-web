import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import type { Unit, Lesson, Activity } from '../data/sampleUnits';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'units' | 'lessons'>('units');
  const [existingUnits, setExistingUnits] = useState<(Unit & { docId: string })[]>([]);

  // Unit creation state
  const [unitTitle, setUnitTitle] = useState('');
  const [unitDescription, setUnitDescription] = useState('');
  const [unitOrder, setUnitOrder] = useState(1);

  // Lesson creation state
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [activities, setActivities] = useState<Omit<Activity, 'id'>[]>([
    { type: 'h5p', url: '', title: '' }
  ]);

  // Load existing units on component mount
  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'units'));
      const units = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: data.id || parseInt(doc.id), // Use the id from data, fallback to doc.id
          docId: doc.id // Keep the actual Firestore document ID
        };
      }) as (Unit & { docId: string })[];
      
      units.sort((a, b) => a.order - b.order);
      setExistingUnits(units);
      
      // Set the next unit order
      const maxOrder = units.length > 0 ? Math.max(...units.map(u => u.order)) : 0;
      setUnitOrder(maxOrder + 1);
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

  const handleActivityChange = (
    index: number,
    field: keyof Omit<Activity, 'id'>,
    value: string
  ) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], [field]: value };
    setActivities(updated);
  };

  const addActivity = () => {
    setActivities([...activities, { type: 'h5p', url: '', title: '' }]);
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newUnit = {
      title: unitTitle,
      description: unitDescription,
      order: unitOrder,
      lessons: [],
      totalLessons: 0,
      id: unitOrder
    };

    try {
      // Create a new document with auto-generated ID, but store the unit order as the id field
      await addDoc(collection(db, 'units'), newUnit);

      alert('Unit created successfully!');

      // Reset form
      setUnitTitle('');
      setUnitDescription('');

      // Reload units
      await loadUnits();
    } catch (error) {
      console.error('Error creating unit:', error);
      alert('Failed to create unit.');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUnitId) {
      alert('Please select a unit');
      return;
    }

    const selectedUnit = existingUnits.find(u => u.docId === selectedUnitId);
    if (!selectedUnit) {
      alert('Selected unit not found');
      return;
    }

    const lessonCount = (selectedUnit.lessons ?? []).length;
    const newLesson: Lesson = {
      id: lessonCount + 1,
      title: lessonTitle,
      description: lessonDescription,
      videoUrl: lessonVideoUrl,
      order: lessonCount + 1,
      activities: activities.map((activity, index) => ({
        ...activity,
        id: index + 1
      }))
    };

    try {
      // Use the docId for the Firestore reference
      const unitDoc = doc(db, 'units', selectedUnitId);

      // Update the unit with the new lesson
      await updateDoc(unitDoc, {
        lessons: arrayUnion(newLesson),
        totalLessons: lessonCount + 1
      });

      alert('Lesson added successfully!');

      // Reset lesson form
      setSelectedUnitId('');
      setLessonTitle('');
      setLessonDescription('');
      setLessonVideoUrl('');
      setActivities([{ type: 'h5p', url: '', title: '' }]);

      // Reload units
      await loadUnits();
    } catch (error) {
      console.error('Error adding lesson:', error);
      alert('Failed to add lesson.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg">
        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('units')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'units'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Create Units
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'lessons'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Add Lessons
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'units' && (
            <div>
              <h2 className="text-2xl font-bold text-blue-600 mb-6">
                Create New Unit
              </h2>

              {/* Existing Units Overview */}
              {existingUnits.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Existing Units:</h3>
                  <div className="space-y-2">
                    {existingUnits.map(unit => (
                      <div
                        key={unit.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span>{unit.title}</span>
                        <span className="text-gray-600">
                          {unit.totalLessons} lessons
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateUnit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unit Title:
                    </label>
                    <input
                      type="text"
                      value={unitTitle}
                      onChange={e => setUnitTitle(e.target.value)}
                      required
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Unit 1: Basic Vocabulary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unit Order:
                    </label>
                    <input
                      type="number"
                      value={unitOrder}
                      onChange={e => setUnitOrder(parseInt(e.target.value))}
                      required
                      min="1"
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Unit Description:
                  </label>
                  <textarea
                    value={unitDescription}
                    onChange={e => setUnitDescription(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    rows={2}
                    placeholder="Brief description of this unit"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Create Unit
                </button>
              </form>
            </div>
          )}

          {activeTab === 'lessons' && (
            <div>
              <h2 className="text-2xl font-bold text-blue-600 mb-6">
                Add Lesson to Unit
              </h2>

              {existingUnits.length === 0 ? (
                <div className="text-center p-8 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800">
                    No units available. Create a unit first.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAddLesson} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Select Unit:
                    </label>
                    <select
                      value={selectedUnitId}
                      onChange={e =>
                        setSelectedUnitId(
                          e.target.value ? e.target.value : ''
                        )
                      }
                      required
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">-- Select a Unit --</option>
                      {existingUnits.map(unit => (
                        <option key={unit.docId} value={unit.docId}>
                          {unit.title} ({unit.totalLessons} lessons)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Lesson Title:
                      </label>
                      <input
                        type="text"
                        value={lessonTitle}
                        onChange={e => setLessonTitle(e.target.value)}
                        required
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                        placeholder="e.g., Greetings and Introductions"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Video URL:
                      </label>
                      <input
                        type="url"
                        value={lessonVideoUrl}
                        onChange={e => setLessonVideoUrl(e.target.value)}
                        required
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                        placeholder="YouTube embed URL"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Lesson Description:
                    </label>
                    <input
                      type="text"
                      value={lessonDescription}
                      onChange={e => setLessonDescription(e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      placeholder="Brief description of this lesson"
                    />
                  </div>

                  {/* Activities */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Activities ({activities.length}):
                      </label>
                      <button
                        type="button"
                        onClick={addActivity}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        + Add Activity
                      </button>
                    </div>

                    {activities.map((activity, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-3 rounded border mb-2"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <input
                            type="text"
                            placeholder="Activity Title"
                            value={activity.title}
                            onChange={e =>
                              handleActivityChange(index, 'title', e.target.value)
                            }
                            required
                            className="p-2 border border-gray-300 rounded"
                          />
                          <select
                            value={activity.type}
                            onChange={e =>
                              handleActivityChange(index, 'type', e.target.value)
                            }
                            className="p-2 border border-gray-300 rounded"
                          >
                            <option value="h5p">H5P</option>
                            <option value="wordwall">Wordwall</option>
                          </select>
                          <input
                            type="url"
                            placeholder="Activity URL"
                            value={activity.url}
                            onChange={e =>
                              handleActivityChange(index, 'url', e.target.value)
                            }
                            required
                            className="p-2 border border-gray-300 rounded"
                          />
                          {activities.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeActivity(index)}
                              className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Add Lesson
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
