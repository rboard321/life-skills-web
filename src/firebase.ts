import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDFUocbiDzZozObfgBszx7WgyZY5WIrHiA",
  authDomain: "life-skills-app-897ec.firebaseapp.com",
  projectId: "life-skills-app-897ec",
  storageBucket: "life-skills-app-897ec.firebasestorage.app",
  messagingSenderId: "86291213691",
  appId: "1:86291213691:web:5d2f0a4b48fbcc29e721de",
  measurementId: "G-8ZPF0PWFT2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

