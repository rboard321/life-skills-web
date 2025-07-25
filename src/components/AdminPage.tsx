import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  query,
  where
} from 'firebase/firestore';
import type { Unit, Lesson, Activity } from '../data/sampleUnits';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'units' | 'lessons' | 'manage' | 'progress'>('units');
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

  // Editing state
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editUnitTitle, setEditUnitTitle] = useState('');
  const [editUnitDescription, setEditUnitDescription] = useState('');
  const [editUnitOrder, setEditUnitOrder] = useState(1);

  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  const [editingLesson, setEditingLesson] = useState<{
    unitDocId: string;
    index: number;
  } | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonDescription, setEditLessonDescription] = useState('');
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState('');
  const [editActivities, setEditActivities] = useState<Activity[]>([]);

  // Student progress state
  const [studentProgress, setStudentProgress] = useState<{
    uid: string;
    displayName: string;
    email: string;
    role: string;
    unitsCompleted: number;
    percentComplete: number;
  }[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Load existing units on component mount
  useEffect(() => {
    loadUnits();
    loadStudentProgress();
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

  const loadStudentProgress = async () => {
    try {
      setLoadingProgress(true);
      const usersSnap = await getDocs(collection(db, 'users'));
      const unitsSnap = await getDocs(collection(db, 'units'));
      const totalUnits = unitsSnap.docs.length;

      const data = await Promise.all(
        usersSnap.docs.map(async (u) => {
          const userData = u.data() as { displayName?: string; email: string; role: string };
          const progressQuery = query(
            collection(db, 'userProgress'),
            where('userId', '==', u.id)
          );
          const progressSnap = await getDocs(progressQuery);
          const progressDocs = progressSnap.docs.map(d =>
            d.data() as {
              completedAt?: unknown;
              overallProgress?: { percentComplete?: number };
            }
          );
          const unitsCompleted = progressDocs.filter(p => p.completedAt).length;
          const percentSum = progressDocs.reduce(
            (acc, p) => acc + (p.overallProgress?.percentComplete || 0),
            0
          );
          const percentComplete = totalUnits > 0 ? Math.round(percentSum / totalUnits) : 0;

          return {
            uid: u.id,
            displayName: userData.displayName || '',
            email: userData.email,
            role: userData.role,
            unitsCompleted,
            percentComplete
          };
        })
      );
      setStudentProgress(data);
    } catch (err) {
      console.error('Failed to load progress', err);
    } finally {
      setLoadingProgress(false);
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

  const handleEditActivityChange = (
    index: number,
    field: keyof Omit<Activity, 'id'>,
    value: string
  ) => {
    const updated = [...editActivities];
    updated[index] = { ...updated[index], [field]: value } as Activity;
    setEditActivities(updated);
  };

  const addEditActivity = () => {
    setEditActivities([
      ...editActivities,
      { id: editActivities.length + 1, type: 'h5p', url: '', title: '' }
    ]);
  };

  const removeEditActivity = (index: number) => {
    setEditActivities(editActivities.filter((_, i) => i !== index));
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

  const startEditUnit = (unit: Unit & { docId: string }) => {
    setEditingUnitId(unit.docId);
    setEditUnitTitle(unit.title);
    setEditUnitDescription(unit.description || '');
    setEditUnitOrder(unit.order);
  };

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnitId) return;
    try {
      const unitDocRef = doc(db, 'units', editingUnitId);
      await updateDoc(unitDocRef, {
        title: editUnitTitle,
        description: editUnitDescription,
        order: editUnitOrder
      });
      await loadUnits();
      setEditingUnitId(null);
    } catch (error) {
      console.error('Error updating unit:', error);
      alert('Failed to update unit.');
    }
  };

  const handleDeleteUnit = async (docId: string) => {
    if (!confirm('Delete this unit and all lessons?')) return;
    try {
      await deleteDoc(doc(db, 'units', docId));
      await loadUnits();
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert('Failed to delete unit.');
    }
  };

  const toggleLessons = (docId: string) => {
    setExpandedUnitId(prev => (prev === docId ? null : docId));
  };

  const startEditLesson = (unitDocId: string, index: number, lesson: Lesson) => {
    setEditingLesson({ unitDocId, index });
    setEditLessonTitle(lesson.title);
    setEditLessonDescription(lesson.description || '');
    setEditLessonVideoUrl(lesson.videoUrl);
    setEditActivities(lesson.activities || []);
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    const { unitDocId, index } = editingLesson;
    try {
      const unitDocRef = doc(db, 'units', unitDocId);
      const unitSnap = await getDoc(unitDocRef);
      if (unitSnap.exists()) {
        const unitData = unitSnap.data() as Unit;
        const lessons = unitData.lessons || [];
        lessons[index] = {
          ...lessons[index],
          title: editLessonTitle,
          description: editLessonDescription,
          videoUrl: editLessonVideoUrl,
          activities: editActivities.map((act, idx) => ({
            ...act,
            id: idx + 1
          }))
        };
        await updateDoc(unitDocRef, { lessons });
        await loadUnits();
        setEditingLesson(null);
        setEditActivities([]);
      }
    } catch (error) {
      console.error('Error updating lesson:', error);
      alert('Failed to update lesson.');
    }
  };

  const handleDeleteLesson = async (unitDocId: string, index: number) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      const unitDocRef = doc(db, 'units', unitDocId);
      const unitSnap = await getDoc(unitDocRef);
      if (unitSnap.exists()) {
        const unitData = unitSnap.data() as Unit;
        let lessons = unitData.lessons || [];
        lessons = lessons.filter((_, i) => i !== index).map((l, idx) => ({
          ...l,
          id: idx + 1,
          order: idx + 1
        }));
        await updateDoc(unitDocRef, {
          lessons,
          totalLessons: lessons.length
        });
        await loadUnits();
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson.');
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
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'manage'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Manage Units
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'progress'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Student Progress
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

          {activeTab === 'progress' && (
            <div>
              <h2 className="text-2xl font-bold text-blue-600 mb-6">Student Progress</h2>
              {loadingProgress ? (
                <p>Loading...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Units Completed</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Overall %</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {studentProgress.map((s) => (
                        <tr key={s.uid}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.displayName || '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{s.email}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{s.role}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{s.unitsCompleted}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{s.percentComplete}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

          {activeTab === 'manage' && (
            <div>
              <h2 className="text-2xl font-bold text-blue-600 mb-6">
                Manage Units and Lessons
              </h2>

              {existingUnits.length === 0 ? (
                <div className="text-center p-8 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800">No units available.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {existingUnits.map(unit => (
                    <div key={unit.docId} className="border rounded p-4">
                      {editingUnitId === unit.docId ? (
                        <form onSubmit={handleUpdateUnit} className="space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editUnitTitle}
                              onChange={e => setEditUnitTitle(e.target.value)}
                              className="p-2 border rounded"
                              placeholder="Unit title"
                              required
                            />
                            <input
                              type="number"
                              value={editUnitOrder}
                              onChange={e => setEditUnitOrder(parseInt(e.target.value))}
                              className="p-2 border rounded"
                              min="1"
                              required
                            />
                            <input
                              type="text"
                              value={editUnitDescription}
                              onChange={e => setEditUnitDescription(e.target.value)}
                              className="p-2 border rounded"
                              placeholder="Description"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">
                              Save
                            </button>
                            <button type="button" onClick={() => setEditingUnitId(null)} className="bg-gray-300 px-3 py-1 rounded">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">
                              {unit.title} (order {unit.order})
                            </h3>
                            {unit.description && (
                              <p className="text-sm text-gray-600">{unit.description}</p>
                            )}
                          </div>
                          <div className="space-x-2">
                            <button onClick={() => startEditUnit(unit)} className="text-blue-600 text-sm">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteUnit(unit.docId)} className="text-red-600 text-sm">
                              Delete
                            </button>
                            <button onClick={() => toggleLessons(unit.docId)} className="text-sm">
                              {expandedUnitId === unit.docId ? 'Hide Lessons' : 'Show Lessons'}
                            </button>
                          </div>
                        </div>
                      )}

                      {expandedUnitId === unit.docId && unit.lessons && (
                        <div className="mt-4 space-y-4">
                          {unit.lessons.map((lesson, idx) => (
                            <div key={lesson.id} className="border rounded p-3">
                              {editingLesson && editingLesson.unitDocId === unit.docId && editingLesson.index === idx ? (
                                <form onSubmit={handleUpdateLesson} className="space-y-2">
                                  <input
                                    type="text"
                                    value={editLessonTitle}
                                    onChange={e => setEditLessonTitle(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="Lesson title"
                                    required
                                  />
                                  <input
                                    type="text"
                                    value={editLessonDescription}
                                    onChange={e => setEditLessonDescription(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="Lesson description"
                                  />
                                  <input
                                    type="url"
                                    value={editLessonVideoUrl}
                                    onChange={e => setEditLessonVideoUrl(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="Video URL"
                                    required
                                  />
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <label className="block text-sm font-medium text-gray-700">
                                        Activities ({editActivities.length}):
                                      </label>
                                      <button
                                        type="button"
                                        onClick={addEditActivity}
                                        className="text-blue-600 hover:underline text-sm"
                                      >
                                        + Add Activity
                                      </button>
                                    </div>
                                    {editActivities.map((activity, index) => (
                                      <div key={index} className="bg-gray-50 p-3 rounded border mb-2">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                          <input
                                            type="text"
                                            placeholder="Activity Title"
                                            value={activity.title}
                                            onChange={e => handleEditActivityChange(index, 'title', e.target.value)}
                                            required
                                            className="p-2 border border-gray-300 rounded"
                                          />
                                          <select
                                            value={activity.type}
                                            onChange={e => handleEditActivityChange(index, 'type', e.target.value)}
                                            className="p-2 border border-gray-300 rounded"
                                          >
                                            <option value="h5p">H5P</option>
                                            <option value="wordwall">Wordwall</option>
                                          </select>
                                          <input
                                            type="url"
                                            placeholder="Activity URL"
                                            value={activity.url}
                                            onChange={e => handleEditActivityChange(index, 'url', e.target.value)}
                                            required
                                            className="p-2 border border-gray-300 rounded"
                                          />
                                          {editActivities.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => removeEditActivity(index)}
                                              className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                                            >
                                              Remove
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex space-x-2">
                                    <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingLesson(null);
                                        setEditActivities([]);
                                      }}
                                      className="bg-gray-300 px-3 py-1 rounded"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium">{lesson.title}</h4>
                                    {lesson.description && (
                                      <p className="text-sm text-gray-600">{lesson.description}</p>
                                    )}
                                  </div>
                                  <div className="space-x-2 text-sm">
                                    <button onClick={() => startEditLesson(unit.docId, idx, lesson)} className="text-blue-600">
                                      Edit
                                    </button>
                                    <button onClick={() => handleDeleteLesson(unit.docId, idx)} className="text-red-600">
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {unit.lessons.length === 0 && (
                            <p className="text-sm text-gray-600">No lessons in this unit.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
