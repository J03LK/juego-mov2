// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration 
// For Firebase JS SDK v7.20.0 and later, measurementId is optional 
const firebaseConfig = { 
    apiKey: "AIzaSyD-yn6RuUH7jTSvCGNYJvG5rjiAlyQe_WM", 
    authDomain: "juego-eab88.firebaseapp.com", 
    databaseURL: "https://juego-eab88-default-rtdb.firebaseio.com", 
    projectId: "juego-eab88", 
    storageBucket: "juego-eab88.firebasestorage.app", 
    messagingSenderId: "1006736094195", 
    appId: "1:1006736094195:web:ba3ef22d21ed0e8a54d886", 
    measurementId: "G-S8WS2LD59Y" 
  }; 
   
  // Initialize Firebase 
  const app = initializeApp(firebaseConfig);
export const db = getDatabase();