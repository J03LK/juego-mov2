import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ref, get } from 'firebase/database';
import { auth, db } from '../config/firebase.config';
import { Image } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';

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
    
            if (snapshot.exists()) {
                const users = snapshot.val();
                const userFromDb = Object.values(users).find(
                    (u: any) => u.email === email
                );
    
                if (userFromDb) {
                    username = userFromDb.username;
                }
            }
    
            if (username) {
                Alert.alert('¡Éxito!', 'Inicio de sesión correcto');
                navigation.replace('Game', { username });
            } else {
                setError('No se encontró un nombre de usuario asociado.');
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
                style={[styles.rankingButton]}
                onPress={() => navigation.navigate('Leaderboard')}
            >
                <Text style={styles.buttonText}>🏆 Ver Ranking</Text>
            </TouchableOpacity>

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
        fontSize: 30,
        textAlign: 'center',
        fontWeight: '700',
        color: 'black', 
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 3, 
        textShadowColor: '#aaa', 
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3, 
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
        width: 150,  
        height: 150, 
        resizeMode: 'contain',
        marginBottom: 30, 
        alignSelf: 'center',
        borderWidth: 4,
        borderColor: '#20272F',
        borderRadius: 15, 
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5, 
    },
});
