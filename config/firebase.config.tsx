import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase
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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);


export const db = getDatabase(app); 
export const auth = getAuth(app);
