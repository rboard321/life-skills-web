import React, { useState, useEffect } from 'react';
import { StudentManager, type Student } from '../../utils/studentManager';
import { useAuth } from '../../contexts/AuthContext';

const StudentManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Create student form state
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [grade, setGrade] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Edit modal state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastInitial, setEditLastInitial] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Delete modal state
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Reset code modal state
  const [resettingStudent, setResettingStudent] = useState<Student | null>(null);
  const [newKidCode, setNewKidCode] = useState<string | null>(null);

  // Bulk import state
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: Array<{ name: string; kidCode: string }>;
    failed: Array<{ name: string; error: string }>;
  } | null>(null);
  const [showImportResults, setShowImportResults] = useState(false);

  // Load students
  const loadStudents = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const teacherStudents = await StudentManager.getTeacherStudents(currentUser.uid);
      setStudents(teacherStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      alert('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [currentUser]);

  // Create student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setCreateError('Teacher information not found');
      return;
    }

    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const result = await StudentManager.createStudent(
        firstName,
        lastInitial,
        currentUser.uid,
        { grade: grade || undefined, notes: notes || undefined }
      );

      setCreateSuccess(`Student created! Kid Code: ${result.kidCode}`);
      setFirstName('');
      setLastInitial('');
      setGrade('');
      setNotes('');

      // Reload students
      await loadStudents();

      // Clear success message after 5 seconds
      setTimeout(() => setCreateSuccess(null), 5000);
    } catch (error: any) {
      setCreateError(error.message || 'Failed to create student');
    } finally {
      setCreating(false);
    }
  };

  // Open edit modal
  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setEditFirstName(student.firstName);
    setEditLastInitial(student.lastInitial);
    setEditGrade(student.grade || '');
    setEditNotes(student.notes || '');
  };

  // Update student
  const handleUpdateStudent = async () => {
    if (!editingStudent) return;

    try {
      await StudentManager.updateStudent(editingStudent.studentId, {
        firstName: editFirstName,
        lastInitial: editLastInitial,
        grade: editGrade || undefined,
        notes: editNotes || undefined
      });

      setEditingStudent(null);
      await loadStudents();
      alert('Student updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update student');
    }
  };

  // Delete student
  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;

    try {
      await StudentManager.deleteStudent(deletingStudent.studentId);
      setDeletingStudent(null);
      await loadStudents();
      alert('Student deleted successfully');
    } catch (error) {
      alert('Failed to delete student');
    }
  };

  // Deactivate/Reactivate student
  const handleToggleActive = async (student: Student) => {
    try {
      if (student.isActive) {
        await StudentManager.deactivateStudent(student.studentId);
      } else {
        await StudentManager.reactivateStudent(student.studentId);
      }
      await loadStudents();
    } catch (error) {
      alert('Failed to update student status');
    }
  };

  // Reset kid code
  const handleResetCode = async () => {
    if (!resettingStudent) return;

    try {
      const newCode = await StudentManager.resetKidCode(resettingStudent.studentId);
      setNewKidCode(newCode);
      await loadStudents();
    } catch (error) {
      alert('Failed to reset kid code');
      setResettingStudent(null);
    }
  };

  // Parse CSV file
  const parseCSV = (csvText: string): Array<{ firstName: string; lastInitial: string; grade?: string; notes?: string }> => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const firstNameIndex = header.findIndex(h => h === 'firstname' || h === 'first name');
    const lastInitialIndex = header.findIndex(h => h === 'lastinitial' || h === 'last initial');
    const gradeIndex = header.findIndex(h => h === 'grade');
    const notesIndex = header.findIndex(h => h === 'notes');

    if (firstNameIndex === -1 || lastInitialIndex === -1) {
      throw new Error('CSV must include "firstName" and "lastInitial" columns');
    }

    const students = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = line.split(',').map(v => v.trim());
      const firstName = values[firstNameIndex];
      const lastInitial = values[lastInitialIndex];

      if (!firstName || !lastInitial) {
        throw new Error(`Row ${i + 1}: firstName and lastInitial are required`);
      }

      students.push({
        firstName,
        lastInitial,
        grade: gradeIndex >= 0 ? values[gradeIndex] : undefined,
        notes: notesIndex >= 0 ? values[notesIndex] : undefined
      });
    }

    return students;
  };

  // Handle bulk import from CSV
  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setImporting(true);
    const success: Array<{ name: string; kidCode: string }> = [];
    const failed: Array<{ name: string; error: string }> = [];

    try {
      const csvText = await file.text();
      const studentsData = parseCSV(csvText);

      for (const studentData of studentsData) {
        try {
          const result = await StudentManager.createStudent(
            studentData.firstName,
            studentData.lastInitial,
            currentUser.uid,
            { grade: studentData.grade, notes: studentData.notes }
          );

          success.push({
            name: `${studentData.firstName} ${studentData.lastInitial}.`,
            kidCode: result.kidCode
          });
        } catch (error: any) {
          failed.push({
            name: `${studentData.firstName} ${studentData.lastInitial}.`,
            error: error.message || 'Unknown error'
          });
        }
      }

      setImportResults({ success, failed });
      setShowImportResults(true);
      await loadStudents();
    } catch (error: any) {
      alert(`CSV parsing error: ${error.message}`);
    } finally {
      setImporting(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Download CSV template
  const downloadCSVTemplate = () => {
    const template = 'firstName,lastInitial,grade,notes\nJohn,D,3,Great student\nSarah,M,4,Needs extra help';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter students
  const filteredStudents = students.filter(student =>
    student.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.kidCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Create Student Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Create Student Account</h2>

        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={creating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Initial *
              </label>
              <input
                type="text"
                value={lastInitial}
                onChange={(e) => setLastInitial(e.target.value.slice(0, 1))}
                maxLength={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={creating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade (Optional)
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={creating}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={creating}
            />
          </div>

          {createError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {createError}
            </div>
          )}

          {createSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700 font-medium">
              {createSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Student'}
          </button>
        </form>

        {/* Bulk Import Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Bulk Import from CSV</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={downloadCSVTemplate}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center gap-2"
            >
              📥 Download CSV Template
            </button>

            <label className={`bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 cursor-pointer flex items-center gap-2 ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {importing ? '⏳ Importing...' : '📤 Import Students from CSV'}
              <input
                type="file"
                accept=".csv"
                onChange={handleBulkImport}
                disabled={importing}
                className="hidden"
              />
            </label>

            <p className="text-sm text-gray-600">
              Upload a CSV file with columns: firstName, lastInitial, grade, notes
            </p>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Students ({filteredStudents.length})</h2>
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No students match your search' : 'No students yet. Create one above!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kid Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.studentId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.displayName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-bold text-blue-600">{student.kidCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.grade || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.lastActiveAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          student.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditClick(student)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setResettingStudent(student)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Reset Code
                      </button>
                      <button
                        onClick={() => handleToggleActive(student)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        {student.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setDeletingStudent(student)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Edit Student</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Initial
                </label>
                <input
                  type="text"
                  value={editLastInitial}
                  onChange={(e) => setEditLastInitial(e.target.value.slice(0, 1))}
                  maxLength={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade
                </label>
                <input
                  type="text"
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setEditingStudent(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStudent}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-red-600">Delete Student?</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <strong>{deletingStudent.displayName}</strong>?
            </p>
            <p className="text-red-600 text-sm mb-6">
              This will permanently delete all of their progress data. This action cannot be undone.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setDeletingStudent(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Code Modal */}
      {resettingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Reset Kid Code</h3>

            {!newKidCode ? (
              <>
                <p className="text-gray-700 mb-4">
                  Generate a new kid code for <strong>{resettingStudent.displayName}</strong>?
                </p>
                <p className="text-yellow-600 text-sm mb-6">
                  Old code: <strong className="font-mono">{resettingStudent.kidCode}</strong>
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setResettingStudent(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetCode}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
                  >
                    Reset Code
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 font-semibold mb-2">New Kid Code Generated!</p>
                  <p className="text-3xl font-mono font-bold text-green-700 text-center">{newKidCode}</p>
                </div>

                <p className="text-gray-600 text-sm mb-6">
                  Give this code to {resettingStudent.displayName}. The old code will no longer work after the current session expires.
                </p>

                <button
                  onClick={() => {
                    setResettingStudent(null);
                    setNewKidCode(null);
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bulk Import Results Modal */}
      {showImportResults && importResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Bulk Import Results</h3>

            {/* Success Section */}
            {importResults.success.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-green-700 mb-3">
                  ✅ Successfully Imported ({importResults.success.length})
                </h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-green-300">
                        <th className="text-left py-2 px-2">Student Name</th>
                        <th className="text-left py-2 px-2">Kid Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResults.success.map((student, index) => (
                        <tr key={index} className="border-b border-green-100">
                          <td className="py-2 px-2">{student.name}</td>
                          <td className="py-2 px-2 font-mono font-bold text-blue-600">{student.kidCode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Failed Section */}
            {importResults.failed.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-red-700 mb-3">
                  ❌ Failed to Import ({importResults.failed.length})
                </h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-red-300">
                        <th className="text-left py-2 px-2">Student Name</th>
                        <th className="text-left py-2 px-2">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResults.failed.map((student, index) => (
                        <tr key={index} className="border-b border-red-100">
                          <td className="py-2 px-2">{student.name}</td>
                          <td className="py-2 px-2 text-red-600">{student.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                <strong>Total:</strong> {importResults.success.length + importResults.failed.length} students processed
              </p>
              <p className="text-green-700">
                <strong>Successful:</strong> {importResults.success.length}
              </p>
              <p className="text-red-700">
                <strong>Failed:</strong> {importResults.failed.length}
              </p>
            </div>

            {/* Download successful kid codes button */}
            {importResults.success.length > 0 && (
              <button
                onClick={() => {
                  const csvContent = 'Name,Kid Code\n' +
                    importResults.success.map(s => `${s.name},${s.kidCode}`).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'imported_students_codes.csv';
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 mb-3"
              >
                📥 Download Kid Codes CSV
              </button>
            )}

            <button
              onClick={() => {
                setShowImportResults(false);
                setImportResults(null);
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
