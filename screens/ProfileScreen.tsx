import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getDatabase, ref, onValue, set, query, orderByChild, equalTo, get } from 'firebase/database';
import { getAuth, updateEmail, updatePassword } from 'firebase/auth';

const ProfileScreen = () => {
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        password: '',
        age: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [searchUsername, setSearchUsername] = useState('');

    const auth = getAuth();
    const db = getDatabase();

    const searchByUsername = async () => {
        try {
            const usersRef = ref(db, 'users');
            const userQuery = query(usersRef, orderByChild('username'), equalTo(searchUsername));

            const snapshot = await get(userQuery);
            if (snapshot.exists()) {
                // Extraemos el primer usuario encontrado y tipamos explícitamente
                const userData = snapshot.val();
                const userKey = Object.keys(userData)[0];
                const data = userData[userKey] as {
                    username: string;
                    email: string;
                    age: string;
                };

                setUserData({
                    username: data.username || '',
                    email: data.email || '',
                    password: '********',
                    age: data.age || '',
                });
            } else {
                Alert.alert('Error', 'Usuario no encontrado');
            }
        } catch (error) {
            Alert.alert('Error', 'Error al buscar usuario');
            console.error(error);
        }
    };

    const handleSave = async () => {
        try {
            if (!auth.currentUser) {
                Alert.alert('Error', 'No hay usuario autenticado');
                return;
            }

            // Validar edad
            const ageNum = parseInt(userData.age);
            if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
                Alert.alert('Error', 'Por favor ingrese una edad válida');
                return;
            }

            // Actualizar email si ha cambiado
            if (userData.email !== auth.currentUser.email) {
                await updateEmail(auth.currentUser, userData.email);
            }

            // Actualizar contraseña si no es '********'
            if (userData.password !== '********') {
                await updatePassword(auth.currentUser, userData.password);
            }

            // Actualizar datos en Realtime Database
            const userRef = ref(db, 'users/' + searchUsername);
            await set(userRef, {
                username: userData.username,
                email: userData.email,
                age: userData.age,
            });

            setIsEditing(false);
            Alert.alert('Éxito', 'Perfil actualizado correctamente');
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el perfil: ' + error.message);
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mi Perfil</Text>

            {/* Campo de búsqueda por username */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    value={searchUsername}
                    onChangeText={setSearchUsername}
                    placeholder="Buscar por username"
                />
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={searchByUsername}
                >
                    <Text style={styles.buttonText}>Buscar</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Username:</Text>
                <TextInput
                    style={styles.input}
                    value={userData.username}
                    onChangeText={(text) => setUserData({ ...userData, username: text })}
                    editable={isEditing}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email:</Text>
                <TextInput
                    style={styles.input}
                    value={userData.email}
                    onChangeText={(text) => setUserData({ ...userData, email: text })}
                    editable={isEditing}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña:</Text>
                <TextInput
                    style={styles.input}
                    value={userData.password}
                    onChangeText={(text) => setUserData({ ...userData, password: text })}
                    secureTextEntry
                    editable={isEditing}
                    placeholder="Nueva contraseña"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Edad:</Text>
                <TextInput
                    style={styles.input}
                    value={userData.age}
                    onChangeText={(text) => setUserData({ ...userData, age: text })}
                    keyboardType="numeric"
                    editable={isEditing}
                />
            </View>

            {!isEditing ? (
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setIsEditing(true)}
                >
                    <Text style={styles.buttonText}>Editar Perfil</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSave}
                >
                    <Text style={styles.buttonText}>Guardar Cambios</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    searchButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        justifyContent: 'center',
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;