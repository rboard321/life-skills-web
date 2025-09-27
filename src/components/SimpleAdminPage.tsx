import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Unit } from '../data/sampleUnits';
import { optimizeYouTubeUrl, getYouTubeWatchUrl } from '../utils/youtube';

interface FirebaseUnit extends Unit {
  docId: string;
}

const SimpleAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'assign'>('create');
  const [existingUnits, setExistingUnits] = useState<FirebaseUnit[]>([]);

  // Unit creation state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [activityUrl, setActivityUrl] = useState('');
  const [activityType, setActivityType] = useState<'h5p' | 'wordwall'>('h5p');
  const [order, setOrder] = useState(1);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(true);

  // Edit state
  const [editingUnit, setEditingUnit] = useState<FirebaseUnit | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editActivityUrl, setEditActivityUrl] = useState('');
  const [editActivityType, setEditActivityType] = useState<'h5p' | 'wordwall'>('h5p');
  const [editOrder, setEditOrder] = useState(1);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setUnitsLoading(true);
      const querySnapshot = await getDocs(collection(db, 'units'));
      const units = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id || parseInt(doc.id, 10),
          title: data.title || '',
          description: data.description || '',
          videoUrl: data.videoUrl || '',
          activityUrl: data.activityUrl || '',
          activityType: data.activityType || 'h5p',
          order: data.order || 1,
          docId: doc.id
        };
      }) as FirebaseUnit[];

      units.sort((a, b) => a.order - b.order);
      setExistingUnits(units);

      // Set next order number
      const maxOrder = units.length > 0 ? Math.max(...units.map(u => u.order)) : 0;
      setOrder(maxOrder + 1);
    } catch (error) {
      console.error('Error loading units:', error);
      alert('Failed to load units. Please refresh the page.');
    } finally {
      setUnitsLoading(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!title.trim() || !description.trim() || !videoUrl.trim() || !activityUrl.trim()) {
        alert('Please fill in all fields');
        return;
      }

      const newUnit: Unit = {
        id: order,
        title: title.trim(),
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        activityUrl: activityUrl.trim(),
        activityType,
        order
      };

      await addDoc(collection(db, 'units'), newUnit);

      // Reset form
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setActivityUrl('');
      setActivityType('h5p');

      // Reload units
      await loadUnits();

      alert('Unit created successfully! 🎉');
    } catch (error) {
      console.error('Error creating unit:', error);
      alert('Failed to create unit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnit = async (unit: FirebaseUnit) => {
    if (!confirm(`Delete "${unit.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'units', unit.docId));
      await loadUnits();
      alert('Unit deleted successfully');
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert('Failed to delete unit');
    }
  };

  const handleEditUnit = (unit: FirebaseUnit) => {
    setEditingUnit(unit);
    setEditTitle(unit.title);
    setEditDescription(unit.description);
    setEditVideoUrl(unit.videoUrl);
    setEditActivityUrl(unit.activityUrl);
    setEditActivityType(unit.activityType);
    setEditOrder(unit.order);
  };

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    setLoading(true);

    try {
      // Validate required fields
      if (!editTitle.trim() || !editDescription.trim() || !editVideoUrl.trim() || !editActivityUrl.trim()) {
        alert('Please fill in all fields');
        return;
      }

      const updatedUnit: Unit = {
        id: editingUnit.id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        videoUrl: editVideoUrl.trim(),
        activityUrl: editActivityUrl.trim(),
        activityType: editActivityType,
        order: editOrder
      };

      await updateDoc(doc(db, 'units', editingUnit.docId), updatedUnit);

      // Reset edit state
      setEditingUnit(null);
      setEditTitle('');
      setEditDescription('');
      setEditVideoUrl('');
      setEditActivityUrl('');
      setEditActivityType('h5p');
      setEditOrder(1);

      // Reload units
      await loadUnits();

      alert('Unit updated successfully! 🎉');
    } catch (error) {
      console.error('Error updating unit:', error);
      alert('Failed to update unit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUnit(null);
    setEditTitle('');
    setEditDescription('');
    setEditVideoUrl('');
    setEditActivityUrl('');
    setEditActivityType('h5p');
    setEditOrder(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Admin Panel</h1>
          <p className="text-gray-600 mt-1">Create and manage life skills units</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Units
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Units ({existingUnits.length})
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'assign'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assign to Students
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Create New Unit</h2>

            <form onSubmit={handleCreateUnit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Basic Communication Skills"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Order in which students see this unit</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what students will learn in this unit..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL *
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://youtube.com/watch?v=..."
                  required
                />
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-gray-500">
                    Any YouTube URL format (watch, share, embed, shorts)
                  </p>
                  <p className="text-xs text-amber-600">
                    ⚠️ Make sure the video is public and allows embedding
                  </p>
                  {videoUrl && (
                    <p className="text-xs text-blue-600">
                      Embed format: {optimizeYouTubeUrl(videoUrl)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity URL *
                  </label>
                  <input
                    type="url"
                    value={activityUrl}
                    onChange={(e) => setActivityUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://h5p.org/... or https://wordwall.net/..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Type
                  </label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as 'h5p' | 'wordwall')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="h5p">H5P Interactive</option>
                    <option value="wordwall">Wordwall Game</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Unit...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Unit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Manage Existing Units</h2>

            {unitsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading units...</p>
              </div>
            ) : existingUnits.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Units Created Yet</h3>
                <p className="text-gray-600 mb-4">Create your first unit to get started!</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create First Unit
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {existingUnits.map((unit) => (
                  <div
                    key={unit.docId}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">Unit {unit.order}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{unit.title}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{unit.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Video: YouTube</span>
                          <span>Activity: {unit.activityType.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => window.open(getYouTubeWatchUrl(unit.videoUrl), '_blank')}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Preview Video
                        </button>
                        <button
                          onClick={() => handleEditUnit(unit)}
                          className="text-green-600 hover:text-green-800 text-sm underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUnit(unit)}
                          className="text-red-600 hover:text-red-800 text-sm underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Unit Modal/Form */}
        {editingUnit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Edit Unit</h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleUpdateUnit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Title *
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Basic Communication Skills"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Order
                      </label>
                      <input
                        type="number"
                        value={editOrder}
                        onChange={(e) => setEditOrder(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe what students will learn in this unit..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Video URL *
                    </label>
                    <input
                      type="url"
                      value={editVideoUrl}
                      onChange={(e) => setEditVideoUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://youtube.com/watch?v=..."
                      required
                    />
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-gray-500">
                        Any YouTube URL format (watch, share, embed, shorts)
                      </p>
                      <p className="text-xs text-amber-600">
                        ⚠️ Make sure the video is public and allows embedding
                      </p>
                      {editVideoUrl && (
                        <p className="text-xs text-blue-600">
                          Embed format: {optimizeYouTubeUrl(editVideoUrl)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activity URL *
                      </label>
                      <input
                        type="url"
                        value={editActivityUrl}
                        onChange={(e) => setEditActivityUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://h5p.org/... or https://wordwall.net/..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activity Type
                      </label>
                      <select
                        value={editActivityType}
                        onChange={(e) => setEditActivityType(e.target.value as 'h5p' | 'wordwall')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="h5p">H5P Interactive</option>
                        <option value="wordwall">Wordwall Game</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating Unit...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Update Unit
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={loading}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assign' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Assign Units to Students</h2>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👨‍🏫</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Coming in Phase 3!</h3>
              <p className="text-gray-600">
                Student assignment features will be available in the next phase of development.
                For now, all students can see all created units.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleAdminPage;