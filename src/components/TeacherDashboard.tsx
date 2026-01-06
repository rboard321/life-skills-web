import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TeacherAssignmentManager, type Unit } from '../utils/teacherAssignments';
import { LibraryManager } from '../utils/libraryManager';
import { StudentManager } from '../utils/studentManager';
import { ProgressTracker, type ClassStatistics } from '../utils/progressTracker';

const TeacherDashboard: React.FC = () => {
  const { currentUser, isTeacher } = useAuth();
  const [libraryUnits, setLibraryUnits] = useState<Unit[]>([]);
  const [assignedUnitIds, setAssignedUnitIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentCount, setStudentCount] = useState(0);
  const [classStats, setClassStats] = useState<ClassStatistics | null>(null);

  useEffect(() => {
    if (!isTeacher || !currentUser) {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        const units = await LibraryManager.getTeacherLibrary(currentUser.uid);
        setLibraryUnits(units);

        const assignment = await TeacherAssignmentManager.getTeacherAssignment(currentUser.uid);
        setAssignedUnitIds(assignment?.unitIds || []);

        const students = await StudentManager.getTeacherStudents(currentUser.uid, false);
        setStudentCount(students.length);

        const stats = await ProgressTracker.getClassStatistics(currentUser.uid);
        setClassStats(stats);
      } catch (err) {
        console.error('Error loading teacher data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isTeacher, currentUser]);

  const toggleUnitAssignment = async (unit: any) => {
    if (!currentUser) return;

    try {
      const unitId = String(unit.id);
      const isCurrentlyAssigned = assignedUnitIds.includes(unitId);

      if (isCurrentlyAssigned) {
        await TeacherAssignmentManager.removeUnitFromTeacher(currentUser.uid, unitId);
        setAssignedUnitIds(prev => prev.filter(id => id !== unitId));
      } else {
        await TeacherAssignmentManager.addUnitToTeacher(
          currentUser.uid,
          unitId,
          currentUser.displayName || currentUser.email || 'Teacher'
        );
        setAssignedUnitIds(prev => [...prev, unitId]);
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
              <p className="text-gray-600">Manage your unit assignments</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Students</span>
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">{studentCount}</div>
            <Link to="/admin?tab=students" className="text-sm text-blue-600 hover:underline mt-2 block">
              Manage Students →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Active This Week</span>
              <span className="text-2xl">⚡</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{classStats?.activeStudents || 0}</div>
            <p className="text-sm text-gray-500 mt-2">Students logged in</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Avg Completion</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-purple-600">{classStats?.averageCompletion || 0}%</div>
            <Link to="/admin/progress" className="text-sm text-purple-600 hover:underline mt-2 block">
              View Progress →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Units Completed</span>
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">{classStats?.unitsCompleted || 0}</div>
            <p className="text-sm text-gray-500 mt-2">Across all students</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/admin"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
            >
              📝 Manage Content
            </Link>
            <Link
              to="/admin/progress"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
            >
              📊 View Progress
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

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
            <div className="space-y-4">
              {libraryUnits.map((unit) => {
                const unitId = String(unit.id);
                const isAssigned = assignedUnitIds.includes(unitId);

                return (
                  <div
                    key={unitId}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">Unit {unit.order}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{unit.title}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{unit.description}</p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => toggleUnitAssignment(unit)}
                          className={`px-4 py-2 rounded-md text-sm font-medium ${
                            isAssigned
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isAssigned ? 'Assigned' : 'Assign'}
                        </button>
                        <Link
                          to={`/unit/${unit.id}/learn`}
                          className="text-blue-600 hover:text-blue-800 text-sm underline text-center"
                        >
                          Preview
                        </Link>
                      </div>
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
