import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getDatabase, ref, get, update } from 'firebase/database';
import { getAuth, updateEmail, updatePassword } from 'firebase/auth';

interface UserData {
    username: string;
    email: string;
    password: string;
    age: string;
}

const ProfileScreen: React.FC = () => {
    const [userData, setUserData] = useState<UserData>({
        username: '',
        email: '',
        password: '',
        age: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userKey, setUserKey] = useState<string | null>(null);

    const auth = getAuth();
    const db = getDatabase();

    const loadUserData = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                console.log('No hay usuario autenticado');
                return;
            }

            // Buscar datos del usuario en Realtime Database
            const usersRef = ref(db, 'users');
            const snapshot = await get(usersRef);

            if (snapshot.exists()) {
                const users = snapshot.val();
                for (const key in users) {
                    if (users[key].email === currentUser.email) { // Cambiado de uid a email
                        setUserKey(key);
                        setUserData({
                            username: users[key].username || '',
                            email: currentUser.email || '',
                            password: '********',
                            age: users[key].age?.toString() || '',
                        });
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos del usuario');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUserData();
    }, []);

    const handleSave = async () => {
        if (!userKey) {
            Alert.alert('Error', 'No se encontró la referencia del usuario');
            return;
        }
    
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert('Error', 'No hay usuario autenticado');
                return;
            }
    
            // Validar edad
            const ageNum = parseInt(userData.age);
            if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
                Alert.alert('Error', 'Por favor ingrese una edad válida');
                return;
            }
    
            // Preparar actualizaciones para Realtime Database
            const updates: Record<string, any> = {};
            
            // Actualizar email si ha cambiado
            if (userData.email !== currentUser.email) {
                await updateEmail(currentUser, userData.email);
                updates.email = userData.email;
            }
    
            // Actualizar contraseña si se ha modificado (no es **)
            if (userData.password && userData.password !== '**') {
                await updatePassword(currentUser, userData.password);
                // Guardar la contraseña encriptada o un indicador en la base de datos
                // Considera usar una función de encriptación en lugar de almacenar en texto plano
                updates.password = userData.password; 
            }
    
            // Actualizar edad y otros campos
            updates.age = ageNum;
            updates.username = userData.username;
    
            // Actualizar en la base de datos solo si hay cambios
            if (Object.keys(updates).length > 0) {
                const userRef = ref(db, `users/${userKey}`);
                await update(userRef, updates);
    
                // Actualizar el estado local
                setUserData(prevData => ({
                    ...prevData,
                    ...updates,
                    password: '**' // Resetear la visualización de la contraseña
                }));
    
                Alert.alert('Éxito', 'Perfil actualizado correctamente');
            }
    
            setIsEditing(false);
        } catch (error: any) {
            console.error('Error al actualizar:', error);
            Alert.alert('Error', 
                error.code === 'auth/requires-recent-login' 
                    ? 'Por favor, cierre sesión y vuelva a iniciar sesión para actualizar sus datos.' 
                    : 'No se pudo actualizar el perfil: ' + error.message
            );
        }
    };
    

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mi Perfil</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Username:</Text>
                <Text style={styles.staticText}>{userData.username}</Text>
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
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    staticText: {
        fontSize: 16,
        padding: 10,
        color: '#666',
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