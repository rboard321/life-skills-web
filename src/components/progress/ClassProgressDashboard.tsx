import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StudentManager, type Student } from '../../utils/studentManager';
import { ProgressTracker, type ClassStatistics, type StudentProgress } from '../../utils/progressTracker';

interface StudentWithProgress extends Student {
  progressData: StudentProgress[];
  unitsCompleted: number;
  totalTime: number;
  completionPercentage: number;
  averageScore: number;
}

const ClassProgressDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentWithProgress[]>([]);
  const [statistics, setStatistics] = useState<ClassStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'completed' | 'time' | 'lastActive'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadClassData();
  }, [currentUser]);

  const loadClassData = async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      const [studentData, stats] = await Promise.all([
        StudentManager.getTeacherStudents(currentUser.uid, false),
        ProgressTracker.getClassStatistics(currentUser.uid)
      ]);

      // Load progress for each student
      const studentsWithProgress = await Promise.all(
        studentData.map(async (student) => {
          const progressData = await ProgressTracker.getStudentProgress(student.studentId, currentUser.uid);
          const unitsCompleted = progressData.filter(p => p.isCompleted).length;
          const totalTime = progressData.reduce((sum, p) => sum + p.totalTimeSeconds, 0);
          const completionPercentage = progressData.length > 0
            ? Math.round((unitsCompleted / progressData.length) * 100)
            : 0;
          const averageScore = progressData.length > 0
            ? Math.round(progressData.reduce((sum, p) => sum + (p.activityScorePercent || 0), 0) / progressData.length)
            : 0;

          return {
            ...student,
            progressData,
            unitsCompleted,
            totalTime,
            completionPercentage,
            averageScore
          };
        })
      );

      setStudents(studentsWithProgress);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading class data:', error);
      alert('Failed to load class progress');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedStudents = [...students].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.displayName.localeCompare(b.displayName);
        break;
      case 'completed':
        comparison = a.unitsCompleted - b.unitsCompleted;
        break;
      case 'time':
        comparison = a.totalTime - b.totalTime;
        break;
      case 'lastActive':
        comparison = a.lastActiveAt.getTime() - b.lastActiveAt.getTime();
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const strugglingStudents = students.filter(s => s.averageScore < 60 && s.progressData.length > 0);
  const inactiveStudents = students.filter(s => {
    const daysSinceActive = (new Date().getTime() - s.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceActive > 7;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading class progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/admin" className="text-blue-600 hover:underline text-sm mb-2 block">
                ← Back to Admin
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Class Progress Dashboard</h1>
              <p className="text-gray-600 mt-1">Overview of all student progress</p>
            </div>
            <button
              onClick={loadClassData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-2">Total Students</div>
            <div className="text-3xl font-bold text-blue-600">
              {statistics?.totalStudents || 0}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-2">Active This Week</div>
            <div className="text-3xl font-bold text-green-600">
              {statistics?.activeStudents || 0}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-2">Avg Completion</div>
            <div className="text-3xl font-bold text-purple-600">
              {statistics?.averageCompletion || 0}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-2">Avg Activity Score</div>
            <div className="text-3xl font-bold text-blue-600">
              {statistics?.averageScore || 0}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-2">Units Completed</div>
            <div className="text-3xl font-bold text-orange-600">
              {statistics?.unitsCompleted || 0}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-2">Total Learning Time</div>
            <div className="text-2xl font-bold text-indigo-600">
              {formatTime(statistics?.totalLearningTime || 0)}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(strugglingStudents.length > 0 || inactiveStudents.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {strugglingStudents.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                  ⚠️ Students Needing Help ({strugglingStudents.length})
                </h3>
                <div className="space-y-2">
                  {strugglingStudents.slice(0, 5).map(student => (
                    <div key={student.studentId} className="flex justify-between items-center">
                      <span className="text-yellow-700">{student.displayName}</span>
                      <span className="text-sm text-yellow-600">{student.averageScore}%</span>
                    </div>
                  ))}
                  {strugglingStudents.length > 5 && (
                    <p className="text-sm text-yellow-600">...and {strugglingStudents.length - 5} more</p>
                  )}
                </div>
              </div>
            )}

            {inactiveStudents.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">
                  📉 Inactive Students ({inactiveStudents.length})
                </h3>
                <div className="space-y-2">
                  {inactiveStudents.slice(0, 5).map(student => (
                    <div key={student.studentId} className="flex justify-between items-center">
                      <span className="text-red-700">{student.displayName}</span>
                      <span className="text-sm text-red-600">
                        {Math.floor((new Date().getTime() - student.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))}d ago
                      </span>
                    </div>
                  ))}
                  {inactiveStudents.length > 5 && (
                    <p className="text-sm text-red-600">...and {inactiveStudents.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Student Comparison Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Student Comparison</h2>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No students yet. Create students in the admin panel.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort('name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kid Code
                    </th>
                    <th
                      onClick={() => handleSort('completed')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Units Completed {sortBy === 'completed' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('time')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Total Time {sortBy === 'time' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('lastActive')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Last Active {sortBy === 'lastActive' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedStudents.map((student) => (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.displayName}</div>
                        {student.grade && (
                          <div className="text-xs text-gray-500">Grade {student.grade}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-bold text-blue-600">{student.kidCode}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.unitsCompleted} / {student.progressData.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(student.totalTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.lastActiveAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                student.completionPercentage >= 80
                                  ? 'bg-green-600'
                                  : student.completionPercentage >= 50
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                              }`}
                              style={{ width: `${student.completionPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{student.completionPercentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold text-blue-600">{student.averageScore}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/admin/students/${student.studentId}/progress`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassProgressDashboard;
