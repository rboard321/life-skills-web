// Simple script to update the teacher assignment
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAKVFZyVSJtcHmI-wgVOlbKh9j3E0YrD5A",
  authDomain: "life-skills-app-897ec.firebaseapp.com",
  projectId: "life-skills-app-897ec",
  storageBucket: "life-skills-app-897ec.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateTeacherAssignment() {
  try {
    const assignmentRef = doc(db, 'teacher_assignments', 'UCR518');
    await updateDoc(assignmentRef, {
      unitIds: ["jRkdnRBFllywqxsptmAq"], // Use the correct unit document ID
      updatedAt: new Date()
    });
    console.log('✅ Teacher assignment updated successfully!');
  } catch (error) {
    console.error('Error updating teacher assignment:', error);
  }
}

updateTeacherAssignment();