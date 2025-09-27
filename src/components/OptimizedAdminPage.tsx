import React, { useState, useEffect } from 'react';
import { UnitsManager, type OptimizedUnit } from '../utils/firebase-optimized';
import { optimizeYouTubeUrl } from '../utils/youtube';

const OptimizedAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'units' | 'users' | 'classes'>('units');
  const [units, setUnits] = useState<OptimizedUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unit creation/editing state
  const [editingUnit, setEditingUnit] = useState<OptimizedUnit | null>(null);
  const [unitForm, setUnitForm] = useState({
    id: 0,
    title: '',
    description: '',
    videoUrl: '',
    activityUrl: '',
    activityType: 'h5p' as 'h5p' | 'wordwall',
    order: 1,
    isActive: true
  });

  // Load units on mount
  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const unitsData = await UnitsManager.getActiveUnits();
      setUnits(unitsData);
      setError(null);
    } catch (err) {
      console.error('Failed to load units:', err);
      setError('Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUnit = async () => {
    try {
      setLoading(true);

      // Optimize YouTube URL
      const optimizedVideoUrl = optimizeYouTubeUrl(unitForm.videoUrl);

      const unitData = {
        ...unitForm,
        videoUrl: optimizedVideoUrl,
        // Generate ID if creating new unit
        id: editingUnit ? editingUnit.id : Math.max(0, ...units.map(u => u.id)) + 1
      };

      await UnitsManager.saveUnit(unitData);
      await loadUnits(); // Refresh units list

      // Reset form
      setUnitForm({
        id: 0,
        title: '',
        description: '',
        videoUrl: '',
        activityUrl: '',
        activityType: 'h5p',
        order: Math.max(0, ...units.map(u => u.order)) + 1,
        isActive: true
      });
      setEditingUnit(null);
      setError(null);
    } catch (err) {
      console.error('Failed to save unit:', err);
      setError('Failed to save unit');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUnit = (unit: OptimizedUnit) => {
    setEditingUnit(unit);
    setUnitForm({
      id: unit.id,
      title: unit.title,
      description: unit.description,
      videoUrl: unit.videoUrl,
      activityUrl: unit.activityUrl,
      activityType: unit.activityType,
      order: unit.order,
      isActive: unit.isActive
    });
  };

  const handleDeactivateUnit = async (unit: OptimizedUnit) => {
    try {
      setLoading(true);
      await UnitsManager.saveUnit({
        ...unit,
        isActive: false
      });
      await loadUnits();
      setError(null);
    } catch (err) {
      console.error('Failed to deactivate unit:', err);
      setError('Failed to deactivate unit');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUnitForm({
      id: 0,
      title: '',
      description: '',
      videoUrl: '',
      activityUrl: '',
      activityType: 'h5p',
      order: Math.max(0, ...units.map(u => u.order)) + 1,
      isActive: true
    });
    setEditingUnit(null);
  };

  const renderUnitsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editingUnit ? 'Edit Unit' : 'Create New Unit'}
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={unitForm.title}
              onChange={(e) => setUnitForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Unit title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={unitForm.description}
              onChange={(e) => setUnitForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Unit description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video URL (YouTube)
            </label>
            <input
              type="url"
              value={unitForm.videoUrl}
              onChange={(e) => setUnitForm(prev => ({ ...prev, videoUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity URL
            </label>
            <input
              type="url"
              value={unitForm.activityUrl}
              onChange={(e) => setUnitForm(prev => ({ ...prev, activityUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="H5P or Wordwall activity URL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity Type
            </label>
            <select
              value={unitForm.activityType}
              onChange={(e) => setUnitForm(prev => ({ ...prev, activityType: e.target.value as 'h5p' | 'wordwall' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="h5p">H5P</option>
              <option value="wordwall">Wordwall</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <input
              type="number"
              value={unitForm.order}
              onChange={(e) => setUnitForm(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={unitForm.isActive}
              onChange={(e) => setUnitForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveUnit}
              disabled={loading || !unitForm.title || !unitForm.videoUrl}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : editingUnit ? 'Update Unit' : 'Create Unit'}
            </button>

            {editingUnit && (
              <button
                onClick={resetForm}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Units</h3>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}

        <div className="space-y-2">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{unit.order}. {unit.title}</span>
                  {!unit.isActive && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{unit.description}</p>
                <p className="text-xs text-gray-500">
                  Activity: {unit.activityType} •
                  Created: {unit.createdAt?.toLocaleDateString()} •
                  Updated: {unit.updatedAt?.toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditUnit(unit)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                {unit.isActive && (
                  <button
                    onClick={() => handleDeactivateUnit(unit)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}

          {units.length === 0 && !loading && (
            <p className="text-gray-500 text-center py-4">No units found</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
      <p className="text-gray-600">User management features will be implemented here.</p>
    </div>
  );

  const renderClassesTab = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Management</h3>
      <p className="text-gray-600">Class management features will be implemented here.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel (Optimized)</h1>
          <p className="text-gray-600 mb-4">
            Manage units, users, and classes with improved Firebase performance.
          </p>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6">
            {[
              { id: 'units', label: 'Units' },
              { id: 'users', label: 'Users' },
              { id: 'classes', label: 'Classes' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'units' | 'users' | 'classes')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'units' && renderUnitsTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'classes' && renderClassesTab()}
      </div>
    </div>
  );
};

export default OptimizedAdminPage;