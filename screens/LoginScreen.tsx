import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import { ref, get } from 'firebase/database';
import { auth, db } from '../config/firebase.config';
import { Image } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Definimos una interfaz para el usuario
interface User {
    email: string;
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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('User found:', user);

            const usersRef = ref(db, 'users');
            const snapshot = await get(usersRef);
            let username = '';
            let userKey = '';

            if (snapshot.exists()) {
                const users = snapshot.val();
                const userKey = Object.keys(users).find(key => users[key].email === email);
                const userFromDb = Object.values(users).find(
                    (u): u is User => (u as User).email === email
                );
            

                if (userFromDb && userFromDb.username) {
                    username = userFromDb.username;
                }

                if (username && userKey) {
                    Alert.alert('¡Éxito!', 'Inicio de sesión correcto');
                    navigation.replace('Game', {
                        username: username,
                        userKey: userKey
                    });
                } else {
                    setError('No se encontró la información del usuario');
                }
            } else {
                setError('No se encontraron usuarios en la base de datos');
            }
        } catch (err: any) {
            console.error('Error al iniciar sesión:', err);
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
        <ImageBackground source={require('../assets/login.png')} style={styles.img}>
            <View style={styles.overlay}>
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
                        placeholderTextColor="rgba(0, 0, 0, 0.7)"
                    />
    
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        editable={!loading}
                        placeholderTextColor="rgba(0, 0, 0, 0.7)"
                    />
    
                    {error ? <Text style={styles.error}>{error}</Text> : null}
    
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
    
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Github')}
                        disabled={loading}
                        style={styles.creatorsButton}
                    >
                        <Text style={styles.creatorsButtonText}>Creadores</Text>
                    </TouchableOpacity>
    
                    <TouchableOpacity
                        style={styles.rankingButton}
                        onPress={() => navigation.navigate('Leaderboard')}
                    >
                        <Text style={styles.buttonText}>🏆 Ver Ranking</Text>
                    </TouchableOpacity>
    
                    <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
                        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Restablecer')} disabled={loading}>
                        <Text style={styles.link}>Olvidaste la contraseña, da click aquí</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    img: {
        flex: 1,
        resizeMode: 'cover',
    },
    overlay: {
        flex: 1,
        //backgroundColor: 'rgba(255, 255, 255, 0.6)', // Fondo translúcido más claro
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '90%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Fondo translúcido para el contenido
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
    },
    image: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
        marginBottom: 30,
        borderRadius: 15,
        borderWidth: 3,
        borderColor: '#ccc',
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 15,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#000',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    button: {
        width: '100%',
        padding: 15,
        backgroundColor: '#007AFF',
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    rankingButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#4CAF50',
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
    },
    creatorsButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#00BFFF',
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    creatorsButtonText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: 'bold',
    },
    error: {
        color: '#FF6B6B',
        fontSize: 14,
        marginBottom: 10,
        textAlign: 'center',
    },
    link: {
        color: '#007AFF',
        textAlign: 'center',
        marginTop: 15,
    },
});
