import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Unit } from '../data/sampleUnits';
import { optimizeYouTubeUrl, getYouTubeWatchUrl } from '../utils/youtube';
import { useAuth } from '../contexts/AuthContext';
import { LibraryManager } from '../utils/libraryManager';
import type { DocumentSnapshot } from 'firebase/firestore';

interface FirebaseUnit extends Unit {
  docId: string;
}

const SimpleAdminPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'my-library' | 'global-library'>('create');
  const [existingUnits, setExistingUnits] = useState<FirebaseUnit[]>([]);
  const [myLibraryUnits, setMyLibraryUnits] = useState<FirebaseUnit[]>([]);
  const [globalLibraryUnits, setGlobalLibraryUnits] = useState<FirebaseUnit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState<'all' | 'h5p' | 'wordwall'>('all');

  // Pagination state
  const [globalLibraryHasMore, setGlobalLibraryHasMore] = useState(false);
  const [globalLibraryLastDoc, setGlobalLibraryLastDoc] = useState<DocumentSnapshot | undefined>();
  const [globalLibraryLoading, setGlobalLibraryLoading] = useState(false);
  const PAGE_SIZE = 20;

  // Unit creation state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [activityUrl, setActivityUrl] = useState('');
  const [activityType, setActivityType] = useState<'h5p' | 'wordwall'>('h5p');
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);

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
  const [editIsActive, setEditIsActive] = useState(true);

  useEffect(() => {
    loadUnits();
    loadMyLibrary();
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (activeTab === 'global-library') {
      loadGlobalLibrary(true); // Reset pagination when search/filter changes
    }
  }, [activeTab, debouncedSearchTerm, activityTypeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMyLibrary = async () => {
    if (!currentUser?.uid) return;

    try {
      const libraryUnits = await LibraryManager.getTeacherLibrary(currentUser.uid);
      const unitsWithDocId = libraryUnits.map(unit => ({
        ...unit,
        docId: typeof unit.id === 'string' ? unit.id : String(unit.id)
      })) as FirebaseUnit[];
      setMyLibraryUnits(unitsWithDocId);
    } catch (error) {
      console.error('Error loading teacher library:', error);
    }
  };

  const loadGlobalLibrary = async (resetPagination = true) => {
    try {
      setGlobalLibraryLoading(true);
      const searchString = debouncedSearchTerm.trim() || undefined;
      const activityType = activityTypeFilter === 'all' ? undefined : activityTypeFilter;

      const lastDoc = resetPagination ? undefined : globalLibraryLastDoc;

      const result = await LibraryManager.getGlobalLibraryPaginated(
        searchString,
        activityType,
        PAGE_SIZE,
        lastDoc
      );

      const unitsWithDocId = result.units.map(unit => ({
        ...unit,
        docId: typeof unit.id === 'string' ? unit.id : String(unit.id)
      })) as FirebaseUnit[];

      if (resetPagination) {
        setGlobalLibraryUnits(unitsWithDocId);
      } else {
        setGlobalLibraryUnits(prev => [...prev, ...unitsWithDocId]);
      }

      setGlobalLibraryHasMore(result.hasMore);
      setGlobalLibraryLastDoc(result.lastDocument);
    } catch (error) {
      console.error('Error loading global library:', error);
    } finally {
      setGlobalLibraryLoading(false);
    }
  };

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
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
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
        order,
        isActive,
        isPrivate,
        createdBy: currentUser?.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'units'), newUnit);

      // Automatically add the created unit to the teacher's library
      if (currentUser?.uid) {
        await LibraryManager.addUnitToTeacherLibrary(currentUser.uid, docRef.id);
      }

      // Reset form
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setActivityUrl('');
      setActivityType('h5p');
      setIsPrivate(false);
      setIsActive(true);

      // Reload units and library
      await loadUnits();
      await loadMyLibrary();

      alert('Unit created successfully! 🎉');
    } catch (error) {
      console.error('Error creating unit:', error);
      alert('Failed to create unit. Please try again.');
    } finally {
      setLoading(false);
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
    setEditIsActive(unit.isActive ?? true);
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
        order: editOrder,
        isActive: editIsActive,
        updatedAt: new Date()
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
      setEditIsActive(true);

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

  const handleTogglePrivacy = async (unit: FirebaseUnit) => {
    if (!currentUser?.uid || unit.createdBy !== currentUser.uid) {
      alert('You can only change privacy settings for units you created.');
      return;
    }

    try {
      await LibraryManager.toggleUnitPrivacy(unit.docId, currentUser.uid);
      await loadMyLibrary();
    } catch (error) {
      console.error('Error toggling privacy:', error);
      alert('Failed to update privacy setting.');
    }
  };

  const handleRemoveFromLibrary = async (unit: FirebaseUnit) => {
    if (!currentUser?.uid) return;

    if (confirm(`Remove "${unit.title}" from your library? This won't delete the unit.`)) {
      try {
        await LibraryManager.removeUnitFromTeacherLibrary(currentUser.uid, unit.docId);
        await loadMyLibrary();
      } catch (error) {
        console.error('Error removing from library:', error);
        alert('Failed to remove unit from library.');
      }
    }
  };

  const handleCopyToLibrary = async (unit: FirebaseUnit) => {
    if (!currentUser?.uid) return;

    try {
      // Check if already in library
      const isInLibrary = await LibraryManager.isUnitInTeacherLibrary(currentUser.uid, unit.docId);
      if (isInLibrary) {
        alert('This unit is already in your library.');
        return;
      }

      await LibraryManager.copyUnitToLibrary(unit.docId, currentUser.uid);
      await loadMyLibrary();
      alert(`"${unit.title}" added to your library!`);
    } catch (error) {
      console.error('Error copying to library:', error);
      alert('Failed to add unit to library.');
    }
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
              onClick={() => setActiveTab('my-library')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'my-library'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Library ({existingUnits.length})
            </button>
            <button
              onClick={() => setActiveTab('global-library')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'global-library'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Global Library
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

                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
                      Keep this unit private
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Private units are only visible to you. Uncheck to share in global library.
                  </p>
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="unitIsActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="unitIsActive" className="ml-2 block text-sm text-gray-700">
                  Unit is Active (visible to students)
                </label>
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

        {activeTab === 'my-library' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">My Library</h2>
              <div className="text-sm text-gray-600">
                {myLibraryUnits.length} units in your library
              </div>
            </div>

            {unitsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading your library...</p>
              </div>
            ) : myLibraryUnits.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your Library is Empty</h3>
                <p className="text-gray-600 mb-4">Create units or copy from the global library to get started!</p>
                <div className="space-x-3">
                  <button
                    onClick={() => setActiveTab('create')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Unit
                  </button>
                  <button
                    onClick={() => setActiveTab('global-library')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Browse Global Library
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {myLibraryUnits.map((unit) => (
                  <div
                    key={unit.docId}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">Unit {unit.order}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{unit.title}</h3>
                          <div className="flex gap-2">
                            {unit.isPrivate ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                🔒 Private
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                🌍 Public
                              </span>
                            )}
                            {unit.createdBy === currentUser?.uid && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                📝 Created by me
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{unit.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Video: YouTube</span>
                          <span>Activity: {unit.activityType.toUpperCase()}</span>
                          {unit.originalCreator && (
                            <span>Copied from global library</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(getYouTubeWatchUrl(unit.videoUrl), '_blank')}
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            Preview
                          </button>
                          {unit.createdBy === currentUser?.uid && (
                            <button
                              onClick={() => handleEditUnit(unit)}
                              className="text-green-600 hover:text-green-800 text-sm underline"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {unit.createdBy === currentUser?.uid && (
                            <button
                              onClick={() => handleTogglePrivacy(unit)}
                              className="text-purple-600 hover:text-purple-800 text-sm underline"
                            >
                              {unit.isPrivate ? 'Make Public' : 'Make Private'}
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveFromLibrary(unit)}
                            className="text-red-600 hover:text-red-800 text-sm underline"
                          >
                            Remove
                          </button>
                        </div>
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

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editUnitIsActive"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="editUnitIsActive" className="ml-2 block text-sm text-gray-700">
                      Unit is Active (visible to students)
                    </label>
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

        {activeTab === 'global-library' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Global Library</h2>
              <div className="text-sm text-gray-600">
                {globalLibraryUnits.length} public units available
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search units..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchTerm !== debouncedSearchTerm && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                <select
                  value={activityTypeFilter}
                  onChange={(e) => setActivityTypeFilter(e.target.value as 'all' | 'h5p' | 'wordwall')}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="h5p">H5P Activities</option>
                  <option value="wordwall">Wordwall Activities</option>
                </select>
              </div>
            </div>

            {globalLibraryLoading && globalLibraryUnits.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading global library...</p>
              </div>
            ) : globalLibraryUnits.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {debouncedSearchTerm || activityTypeFilter !== 'all' ? 'No Matching Units' : 'No Public Units'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {debouncedSearchTerm || activityTypeFilter !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'Be the first to create and share a public unit!'}
                </p>
                {(debouncedSearchTerm || activityTypeFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setActivityTypeFilter('all');
                    }}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {globalLibraryUnits.map((unit) => (
                  <div
                    key={unit.docId}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">Unit {unit.order}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{unit.title}</h3>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              🌍 Public
                            </span>
                            {unit.createdBy === currentUser?.uid && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                📝 Created by me
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{unit.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Video: YouTube</span>
                          <span>Activity: {unit.activityType.toUpperCase()}</span>
                          {unit.createdAt && (
                            <span>Created: {new Date(unit.createdAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(getYouTubeWatchUrl(unit.videoUrl), '_blank')}
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleCopyToLibrary(unit)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Add to My Library
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Load More Button */}
                {globalLibraryHasMore && (
                  <div className="text-center pt-6">
                    <button
                      onClick={() => loadGlobalLibrary(false)}
                      disabled={globalLibraryLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-md transition-colors flex items-center gap-2 mx-auto"
                    >
                      {globalLibraryLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More Units
                          <span className="text-sm opacity-75">({PAGE_SIZE} more)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleAdminPage;