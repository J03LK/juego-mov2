import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { getDatabase, ref, get, update } from 'firebase/database';
import { getAuth, updateEmail, updatePassword } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';

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
    const [image, setImage] = useState<string | null>(null);  

    const auth = getAuth();
    const db = getDatabase();

    const loadUserData = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                console.log('No hay usuario autenticado');
                return;
            }

            const usersRef = ref(db, 'users');
            const snapshot = await get(usersRef);

            if (snapshot.exists()) {
                const users = snapshot.val();
                for (const key in users) {
                    if (users[key].email === currentUser.email) { 
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
    
            const ageNum = parseInt(userData.age);
            if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
                Alert.alert('Error', 'Por favor ingrese una edad válida');
                return;
            }
    
            const updates: Record<string, any> = {};
            
            if (userData.email !== currentUser.email) {
                await updateEmail(currentUser, userData.email);
                updates.email = userData.email;
            }
    
            if (userData.password && userData.password !== '**') {
                await updatePassword(currentUser, userData.password);
                updates.password = userData.password; 
            }
    
            updates.age = ageNum;
            updates.username = userData.username;
    
            if (Object.keys(updates).length > 0) {
                const userRef = ref(db, `users/${userKey}`);
                await update(userRef, updates);
    
                setUserData(prevData => ({
                    ...prevData,
                    ...updates,
                    password: '**' 
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

    const pickImage = async () => {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
        if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
            alert('Se necesitan permisos para usar la cámara o la galería.');
            return;
        }
    
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
    
        if (!result.canceled) {
            setImage(result.assets[0].uri);  
        }
    };
    
    const pickImageC = async () => {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
        if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
            alert('Se necesitan permisos para usar la cámara o la galería.');
            return;
        }
    
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
    
        if (!result.canceled) {
            setImage(result.assets[0].uri);  
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

            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    Alert.alert('Selecciona una opción', '', [
                        { text: 'Tomar una foto', onPress: pickImage },
                        { text: 'Seleccionar de la galería', onPress: pickImageC },
                        { text: 'Cancelar', style: 'cancel' },
                    ]);
                }}
            >
                <Text style={styles.buttonText}>Tomar o Seleccionar Foto</Text>
            </TouchableOpacity>

            {image && (
                <Image
                    source={{ uri: image }}
                    style={styles.profileImage}
                />
            )}

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
        backgroundColor: '#2b2b2b',  
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#FF6347', 
        fontFamily: 'Courier New',  
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 18,
        marginBottom: 5,
        fontWeight: '500',
        color: '#fff',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: '#fff',
        backgroundColor: '#333', 
    },
    staticText: {
        fontSize: 16,
        padding: 10,
        color: '#bbb',
    },
    button: {
        backgroundColor: '#FF6347',  
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    profileImage: {
        width: 250,
        height: 250,
        borderRadius: 10,
        marginTop: 20,
    },
});

export default ProfileScreen;
