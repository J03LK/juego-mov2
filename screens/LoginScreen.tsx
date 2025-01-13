import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ref, get } from 'firebase/database';
import { auth, db } from '../config/firebase.config';
import { Image } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Definimos la interfaz para el usuario
interface User {
    email: string;
    password: string;
    username: string;
}

interface LoginScreenProps {
    navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Por favor completa todos los campos');
            return;
        }
    
        setLoading(true);
        setError('');
    
        try {
            // Utilizando Firebase Authentication para iniciar sesión con email y contraseña
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
    
            console.log('User found:', user);
    
            // Buscamos el username en la base de datos, ya que displayName no siempre estará disponible
            const usersRef = ref(db, 'users'); // Referencia a la ubicación en la base de datos
            const snapshot = await get(usersRef);
    
            let username = '';
    
            // Verificamos si los usuarios existen en la base de datos
            if (snapshot.exists()) {
                const users = snapshot.val();
                const userFromDb = Object.values(users).find(
                    (u: any) => u.email === email // Verificamos por el correo electrónico
                );
    
                if (userFromDb) {
                    username = userFromDb.username; // Obtenemos el username de la base de datos
                }
            }
    
            // Si se encuentra un username, navegar a la pantalla de juego
            if (username) {
                Alert.alert('¡Éxito!', 'Inicio de sesión correcto');
                navigation.replace('Game', { username }); // Navegar a la pantalla de juego con el username
            } else {
                setError('No se encontró un nombre de usuario asociado.');
            }
    
        } catch (err: any) {
            console.error('Error al iniciar sesión:', err);
    
            // Lógica de manejo de errores
            switch (err.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setError('Email o contraseña incorrectos');
                    break;
                default:
                    setError('Error al iniciar sesión');
                    break;
            }
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Ahorcado - Login</Text>
            
          <Image
                         source={require('../assets/icono.png')} 
                         style={styles.image}
                     />
         
          
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
            />

            <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
            />

            {/* Mostrar error si existe */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Botón de inicio de sesión */}
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Iniciar Sesión</Text>
                )}
            </TouchableOpacity>

            {/* Botón de creadores */}
            <TouchableOpacity 
                onPress={() => navigation.navigate('Github')} 
                disabled={loading} 
                style={styles.creatorsButton} 
            > 
                <Text style={styles.creatorsButtonText}>Creadores</Text> 
            </TouchableOpacity> 

            {/* Botón para ver ranking */}
            <TouchableOpacity
                style={[styles.rankingButton]}
                onPress={() => navigation.navigate('Leaderboard')}
            >
                <Text style={styles.buttonText}>🏆 Ver Ranking</Text>
            </TouchableOpacity>

            {/* Enlace para registrarse */}
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
                <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#E6F7FF', 
    },
    creatorsButtonText: { 
        fontSize: 15, 
        color: 'white', 
        fontWeight: 'bold', 
    }, 
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    creatorsButton: { 
        backgroundColor: '#00BFFF',   
        paddingVertical: 15, 
        paddingHorizontal: 25, 
        marginTop: 20, 
        alignItems: 'center', 
        shadowColor: '#000',   
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 3.5, 
        elevation: 5,  
    }, 
    input: {
        borderWidth: 1,
        borderColor: 'black',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
        backgroundColor: 'white',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 5,
        marginTop: 10,
    },
    rankingButton: {
        backgroundColor: '#4CAF50', 
        padding: 15,
        borderRadius: 5,
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    error: {
        color: 'red',
        marginBottom: 10,
    },
    link: {
        color: '#007AFF',
        textAlign: 'center',
        marginTop: 15,
    },
    image: {
        width: 200,   
        height: 200,  
        resizeMode: 'contain', 
        marginBottom: 20, 
        alignSelf: 'center',
    },
});