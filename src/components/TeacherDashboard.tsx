import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TeacherAssignmentManager, type Unit } from '../utils/teacherAssignments';
import { LibraryManager } from '../utils/libraryManager';

const TeacherDashboard: React.FC = () => {
  const { currentUser, teacherCode, isTeacher } = useAuth();
  const [libraryUnits, setLibraryUnits] = useState<Unit[]>([]);
  const [assignedUnitIds, setAssignedUnitIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isTeacher || !teacherCode || !currentUser) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load teacher's library units
        const units = await LibraryManager.getTeacherLibrary(currentUser.uid);
        setLibraryUnits(units);

        // Load current assignments
        const assignment = await TeacherAssignmentManager.getTeacherAssignment(teacherCode);
        setAssignedUnitIds(assignment?.unitIds || []);
      } catch (err) {
        console.error('Error loading teacher data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isTeacher, teacherCode, currentUser]);

  const toggleUnitAssignment = async (unit: any) => {
    if (!teacherCode || !currentUser) return;

    try {
      // Use document ID for assignment, not the internal id field
      const unitDocId = (unit as any).docId || String(unit.id);
      const isCurrentlyAssigned = assignedUnitIds.includes(unitDocId);

      if (isCurrentlyAssigned) {
        await TeacherAssignmentManager.removeUnitFromTeacher(teacherCode, unitDocId);
        setAssignedUnitIds(prev => prev.filter(id => id !== unitDocId));
      } else {
        await TeacherAssignmentManager.addUnitToTeacher(
          teacherCode,
          unitDocId,
          currentUser.displayName || currentUser.email || 'Teacher',
          currentUser.uid
        );
        setAssignedUnitIds(prev => [...prev, unitDocId]);
      }
    } catch (err) {
      console.error('Error updating assignment:', err);
      setError('Failed to update assignment');
    }
  };

  if (!isTeacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access denied. Teachers only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Teacher Code */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
              <p className="text-gray-600">Manage your unit assignments</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium mb-1">Your Teacher Code</p>
                <p className="text-2xl font-bold text-blue-800 font-mono">{teacherCode || 'Loading...'}</p>
                <p className="text-xs text-blue-600 mt-1">Share this code with your students</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/admin"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
            >
              📝 Create New Unit
            </Link>
            <button
              onClick={() => navigator.clipboard.writeText(teacherCode || '')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
            >
              📋 Copy Teacher Code
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Unit Assignment */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Unit Assignments</h2>
            <p className="text-gray-600 mt-1">
              Select which units from your library to assign to your students. Assigned units: {assignedUnitIds.length}
            </p>
          </div>

          {libraryUnits.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📚</div>
              <p className="text-gray-600 mb-4">Your library is empty</p>
              <p className="text-gray-500 text-sm mb-4">
                Create units or add them from the global library to get started.
              </p>
              <Link
                to="/admin"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Go to Admin Panel
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {libraryUnits.map((unit) => {
                const unitDocId = (unit as any).docId || String(unit.id);
                const isAssigned = assignedUnitIds.includes(unitDocId);
                return (
                  <div
                    key={unit.id}
                    className={`border rounded-lg p-6 transition-all ${
                      isAssigned
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">
                        {unit.title}
                      </h3>
                      <div
                        className={`ml-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
                          isAssigned ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        {isAssigned ? '✓' : ''}
                      </div>
                    </div>

                    {unit.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {unit.description}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleUnitAssignment(unit)}
                        className={`flex-1 py-2 px-3 rounded-md font-medium transition-colors ${
                          isAssigned
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {isAssigned ? 'Remove' : 'Assign'}
                      </button>
                      <Link
                        to={`/unit/${unit.id}/learn`}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        title="Preview unit"
                      >
                        👁️
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;