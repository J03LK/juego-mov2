import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Dimensions,
    Image,
    ImageBackground
} from 'react-native';
import { ref, set } from 'firebase/database';
import { auth, db } from '../config/firebase.config';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';

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
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userId = username.toLowerCase().replace(/\s+/g, '_');
            const userData = {
                username,
                email: user.email,
                password,
                gameStats: {
                    score: 0,
                    gamesPlayed: 0,
                    highestScore: 0,
                    lastGameDate: null
                },
                createdAt: new Date().toISOString(),
            };

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

            switch (err.code) {
                case 'auth/email-already-in-use':
                    setError('El email ya está en uso');
                    break;
                case 'auth/invalid-email':
                    setError('El email proporcionado no es válido');
                    break;
                case 'auth/weak-password':
                    setError('La contraseña es demasiado débil');
                    break;
                default:
                    setError('Error al registrar usuario');
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../assets/registro.png')}
            style={styles.img}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Registro</Text>

                    <Image
                        source={require('../assets/icono.png')}
                        style={styles.image}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Nombre de usuario"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        placeholderTextColor="rgba(0, 0, 0, 0.7)"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="rgba(0, 0, 0, 0.7)"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        placeholderTextColor="rgba(0, 0, 0, 0.7)"
                    />
                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : null}
                    <TouchableOpacity onPress={handleRegister} style={styles.button}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Registrarse</Text>
                        )}
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '90%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
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
        width: 100,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 20,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#000',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    button: {
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
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 14,
        marginVertical: 10,
        textAlign: 'center',
    },
});
