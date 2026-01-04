import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StudentManager, type Student } from '../../utils/studentManager';
import { ProgressTracker, type StudentProgress, type StudentSummary } from '../../utils/progressTracker';
import { useUnits } from '../../hooks/useUnits';
import { useAuth } from '../../contexts/AuthContext';

const StudentProgressDashboard: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const { currentUser } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { units } = useUnits();

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      const [studentData, progressData, summaryData] = await Promise.all([
        StudentManager.getStudentById(studentId),
        ProgressTracker.getStudentProgress(studentId, currentUser?.uid),
        ProgressTracker.getStudentSummary(studentId, currentUser?.uid)
      ]);

      setStudent(studentData);
      setProgress(progressData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading student data:', error);
      alert('Failed to load student progress');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const exportToCSV = () => {
    if (!student || progress.length === 0) return;

    const headers = ['Unit ID', 'Activity Completed', 'Score %', 'Attempts', 'Total Time', 'Completed At'];
    const rows = progress.map(p => [
      p.unitId,
      p.activityCompletedAt ? 'Yes' : 'No',
      `${Math.round(p.activityScorePercent || 0)}%`,
      p.activityAttempts || 0,
      formatTime(p.totalTimeSeconds),
      p.isCompleted && p.updatedAt ? p.updatedAt.toLocaleDateString() : 'In Progress'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${student.displayName}_progress.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student progress...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Student Not Found</h2>
          <Link to="/admin" className="text-blue-600 hover:underline">
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/admin" className="text-blue-600 hover:underline text-sm mb-2 block">
                ← Back to Admin
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {student.displayName}'s Progress
              </h1>
              <p className="text-gray-600 mt-1">
                Kid Code: <span className="font-mono font-bold text-blue-600">{student.kidCode}</span>
                {student.grade && ` • Grade: ${student.grade}`}
              </p>
            </div>
            <button
              onClick={exportToCSV}
              disabled={progress.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📊 Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-2">Units Completed</div>
            <div className="text-3xl font-bold text-blue-600">
              {summary?.unitsCompleted || 0}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-2">Total Learning Time</div>
            <div className="text-3xl font-bold text-green-600">
              {formatTime(summary?.totalTimeSeconds || 0)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-2">Average Score</div>
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(
                progress.length > 0
                  ? progress.reduce((sum, p) => sum + (p.activityScorePercent || 0), 0) / progress.length
                  : 0
              )}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-2">Last Active</div>
            <div className="text-lg font-bold text-gray-700">
              {summary?.lastActiveAt ? summary.lastActiveAt.toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Progress List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Unit Progress</h2>

          {progress.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No progress recorded yet. Student hasn't started any units.
            </div>
          ) : (
            <div className="space-y-4">
              {progress.map((p) => {
                const unit = units.find(u => String(u.id) === String(p.unitId));
                const unitTitle = unit?.title || `Unit ${p.unitId}`;

                return (
                  <div
                    key={p.unitId}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{unitTitle}</h3>
                        <p className="text-sm text-gray-600">Unit ID: {p.unitId}</p>
                      </div>
                      {p.isCompleted ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          ✓ Completed
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                          In Progress
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Activity Score */}
                      <div className="bg-blue-50 p-4 rounded-md">
                        <div className="text-sm text-gray-600 mb-2">Activity Score</div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-blue-600">
                            {Math.round(p.activityScorePercent || 0)}%
                          </span>
                          {p.activityCompletedAt && (
                            <span className="text-green-600 text-sm">✓ Done</span>
                          )}
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(p.activityScorePercent || 0, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          {p.activityCorrectCount || 0} / {p.activityTotalCount || 0} correct
                        </p>
                      </div>

                      {/* Activity Progress */}
                      <div className="bg-purple-50 p-4 rounded-md">
                        <div className="text-sm text-gray-600 mb-2">Activity</div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-purple-600">
                            {p.activityAttempts || 0}
                          </span>
                          {p.activityCompletedAt && (
                            <span className="text-green-600 text-sm">✓ Done</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {p.activityCompletedAt ? 'Completed' : 'Not started'}
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          Time: {formatTime(p.activityTimeSeconds)}
                        </p>
                      </div>

                      {/* Total Time */}
                      <div className="bg-green-50 p-4 rounded-md">
                        <div className="text-sm text-gray-600 mb-2">Total Time</div>
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          {formatTime(p.totalTimeSeconds)}
                        </div>
                        {p.isCompleted && p.updatedAt && (
                          <p className="text-xs text-gray-600">
                            Completed: {p.updatedAt.toLocaleDateString()}
                          </p>
                        )}
                        {!p.isCompleted && p.updatedAt && (
                          <p className="text-xs text-gray-600">
                            Last update: {p.updatedAt.toLocaleDateString()}
                          </p>
                        )}
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

export default StudentProgressDashboard;
