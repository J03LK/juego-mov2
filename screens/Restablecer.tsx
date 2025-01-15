import { Button, StyleSheet, Text, View, TextInput, Alert, Image, TouchableOpacity, ImageBackground } from 'react-native';
import React, { useState } from 'react';
// FIREBASE
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase.config';

export default function RestablecerScreen() {
    const [email, setEmail] = useState("");

    function restablecer() {
        sendPasswordResetEmail(auth, email)
            .then(() => {
                Alert.alert("Mensaje", "Se ha enviado un mensaje a su correo electrónico");
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                Alert.alert(errorCode, errorMessage);
            });
    }

    return (
        <ImageBackground source={require('../assets/restablecer.png')} style={styles.img}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Restablecer Contraseña</Text>
                    <Image source={require('../assets/seguridad.png')} style={styles.image} />
                    <Text style={styles.subtitle}>
                        Ingresa tu correo para recibir un enlace de restablecimiento
                    </Text>
                    <TextInput
                        placeholder="Correo Electrónico"
                        style={styles.input}
                        keyboardType="email-address"
                        placeholderTextColor="rgba(0, 0, 0, 0.7)" // Cambio a un color más oscuro para el placeholder
                        onChangeText={(texto) => setEmail(texto)}
                    />
                    <TouchableOpacity onPress={restablecer} style={styles.button}>
                        <Text style={styles.buttonText}>Enviar</Text>
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
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
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
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(0, 0, 0, 0.8)', // Texto más oscuro para el contraste
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: 'rgba(0, 0, 0, 0.7)',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 20,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#000', // Texto oscuro para mejor visibilidad
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    button: {
        width: '100%',
        padding: 15,
        backgroundColor: '#1a7',
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
    },
});
