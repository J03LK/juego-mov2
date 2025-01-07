import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ref, get } from 'firebase/database';
import { db } from '../config/firebase.config';

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
            const usersRef = ref(db, 'users');
            const snapshot = await get(usersRef);

            if (snapshot.exists()) {
                const users = snapshot.val();
                const user = Object.values(users).find(
                    (u: User) => u.email === email && u.password === password
                ) as User | undefined;

                console.log('User found:', user);

                if (user && user.username) {
                    Alert.alert('¡Éxito!', 'Inicio de sesión correcto');
                    navigation.replace('Game', { username: user.username });
                } else {
                    setError('Email o contraseña incorrectos');
                }
            } else {
                setError('No se encontraron usuarios registrados');
            }
        } catch (err: any) {
            console.error('Error al iniciar sesión:', err);
            setError('Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Ahorcado - Login</Text>

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
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 5,
        marginTop: 10,
    },
    rankingButton: {
        backgroundColor: '#4CAF50', // Color verde para diferenciarlo
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
});
