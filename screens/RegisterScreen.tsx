import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { ref, set, get } from 'firebase/database';
import { db } from '../config/firebase.config';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigation = useNavigation();

    const handleRegister = async () => {
        if (!username || !email || !password) {
            setError('Por favor completa todos los campos');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Verificar si el usuario ya existe
            const userRef = ref(db, `users`);
            const snapshot = await get(userRef);
            let userExists = false;

            if (snapshot.exists()) {
                // Verificar si el email o username ya están en uso
                snapshot.forEach((childSnapshot) => {
                    const userData = childSnapshot.val();
                    if (userData.email === email || userData.username === username) {
                        userExists = true;
                    }
                });
            }

            if (userExists) {
                setError('El usuario o email ya existe');
                setLoading(false);
                return;
            }

            // Crear un ID único basado en el username
            const userId = username.toLowerCase().replace(/\s+/g, '_');

            const userData = {
                username,
                email,
                password,
                gameStats: {
                    score: 0,
                    gamesPlayed: 0,
                    highestScore: 0,
                    lastGameDate: null
                },
                createdAt: new Date().toISOString(),
            };
            
            // Guardar usando el username como ID
            await set(ref(db, `users/${userId}`), userData);
            

            Alert.alert(
                '¡Éxito!',
                'Registro completado correctamente. ¡Puedes comenzar a jugar!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Login' as never)
                    }
                ]
            );
        } catch (err: any) {
            console.error(err);
            setError('Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Nombre de usuario"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity onPress={handleRegister} style={styles.button}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Registrarse</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    input: {
        width: '100%',
        padding: 10,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
    },
    button: {
        width: '100%',
        padding: 15,
        backgroundColor: '#1a73e8',
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginVertical: 10,
    },
});