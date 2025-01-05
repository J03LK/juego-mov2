// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCmGgs4S8DbIMKQEyCd0Za-H-2Bmz_TT5c",
    authDomain: "ahorcado-1dc6a.firebaseapp.com",
    databaseURL: "https://ahorcado-1dc6a-default-rtdb.firebaseio.com",
    projectId: "ahorcado-1dc6a",
    storageBucket: "ahorcado-1dc6a.firebasestorage.app",
    messagingSenderId: "891306748972",
    appId: "1:891306748972:web:f4cc747deb63c0a55d3589",
    measurementId: "G-QRCLR5EMN8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase();