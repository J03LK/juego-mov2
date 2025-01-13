import { Button, StyleSheet, Text, View, TextInput, Alert } from 'react-native';
import React, { useState } from 'react';
//FIREBASE
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase.config';

export default function RestablecerScreen() {

    const [email, setEmail] = useState("");

    function restablecer() {
        sendPasswordResetEmail(auth, email)
            .then(() => {
                // Password reset email sent!
                // ..
                Alert.alert("Mensaje", "Se ha enviado un mensaje a su correo electrónico");
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                Alert.alert(errorCode, errorMessage);
                // ..
            });
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Restablecer Contraseña</Text>
            <Text style={styles.subtitle}>Ingresa tu correo para recibir un enlace de restablecimiento</Text>
            
            <TextInput
                placeholder="Correo Electrónico"
                style={styles.input}
                keyboardType="email-address"
                onChangeText={(texto) => setEmail(texto)}
            />
            
            <Button title="Enviar" onPress={restablecer} color="green" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f7f7f7',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: 'black',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 20,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#fff',
    },
});
