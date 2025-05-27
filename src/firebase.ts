// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDFUocbiDzZozObfgBszx7WgyZY5WIrHiA",
    authDomain: "life-skills-app-897ec.firebaseapp.com",
    projectId: "life-skills-app-897ec",
    storageBucket: "life-skills-app-897ec.firebasestorage.app",
    messagingSenderId: "86291213691",
    appId: "1:86291213691:web:5d2f0a4b48fbcc29e721de",
    measurementId: "G-8ZPF0PWFT2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);