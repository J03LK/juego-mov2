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
    Image
} from 'react-native';
import { ref, set, get } from 'firebase/database';
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
    
            // Crear un ID único basado en el username
            const userId = username.toLowerCase().replace(/\s+/g, '_');
    
            const userData = {
                username,
                email: user.email, // Asegurarse de usar el email proporcionado por Firebase
                password, // Aunque no se recomienda guardar contraseñas en texto plano
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
        <View style={styles.container}>
            <Text style={styles.title}>REGISTRO</Text>
            
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
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#E6F7FF',
    },
    title: {
        fontSize: 35,
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
    input: {
        width: '100%',
        padding: 15,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 10,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    button: {
        width: '100%',
        padding: 15,
        backgroundColor: '#1a73e8',
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginVertical: 10,
        textAlign: 'center',
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
