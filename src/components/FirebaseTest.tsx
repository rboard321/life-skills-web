import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const FirebaseTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFirestoreRead = async () => {
    try {
      addTestResult('Testing Firestore read access...');
      const querySnapshot = await getDocs(collection(db, 'units'));
      addTestResult(`✅ Firestore read successful! Found ${querySnapshot.size} units`);
      return true;
    } catch (error: any) {
      addTestResult(`❌ Firestore read failed: ${error.message}`);
      console.error('Firestore read error:', error);
      return false;
    }
  };

  const testFirestoreWrite = async () => {
    try {
      addTestResult('Testing Firestore write access...');
      const testDocRef = doc(db, 'test', 'connection-test');
      await setDoc(testDocRef, {
        timestamp: new Date(),
        user: currentUser?.uid || 'anonymous',
        test: 'Firebase connection test'
      });
      addTestResult('✅ Firestore write successful!');
      return true;
    } catch (error: any) {
      addTestResult(`❌ Firestore write failed: ${error.message}`);
      console.error('Firestore write error:', error);
      return false;
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);

    addTestResult('🔥 Starting Firebase connection tests...');
    addTestResult(`Auth status: ${currentUser ? `Logged in as ${currentUser.email}` : 'Not authenticated'}`);
    addTestResult(`Project ID: ${db.app.options.projectId}`);

    await testFirestoreRead();

    if (currentUser) {
      await testFirestoreWrite();
    } else {
      addTestResult('⚠️ Skipping write test - not authenticated');
    }

    addTestResult('🏁 Tests completed');
    setLoading(false);
  };

  useEffect(() => {
    // Auto-run tests on component mount
    runAllTests();
  }, [currentUser]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Firebase Connection Test</h2>

      <div className="mb-4">
        <button
          onClick={runAllTests}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Running Tests...' : 'Run Connection Tests'}
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="font-medium text-gray-900 mb-2">Test Results:</h3>
        <div className="space-y-1 text-sm font-mono">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet...</p>
          ) : (
            testResults.map((result, index) => (
              <div
                key={index}
                className={`${
                  result.includes('✅') ? 'text-green-700' :
                  result.includes('❌') ? 'text-red-700' :
                  result.includes('⚠️') ? 'text-yellow-700' :
                  'text-gray-700'
                }`}
              >
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Common CORS Error Solutions:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Check Firebase Console → Authentication → Settings → Authorized domains</li>
          <li>Verify Firestore Security Rules allow your operations</li>
          <li>Ensure you're logged in for write operations</li>
          <li>Check browser network tab for detailed error messages</li>
        </ul>
      </div>
    </div>
  );
};

export default FirebaseTest;