// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyASxNnhh7woE3FnPSGVp3Mk3V75zbWWm0k",
    authDomain: "ahorcado-32c8e.firebaseapp.com",
    projectId: "ahorcado-32c8e",
    storageBucket: "ahorcado-32c8e.firebasestorage.app",
    messagingSenderId: "460200584469",
    appId: "1:460200584469:web:47fe097eebd975fe5e751c",
    measurementId: "G-YCM4LHNWW2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase();