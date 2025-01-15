import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ImageBackground } from 'react-native';
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
        <ImageBackground
            source={require('../assets/perfil.png')} // Imagen de fondo
            style={styles.img}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Mi Perfil</Text>

                    {/* Nombre de usuario (No editable) */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Username:</Text>
                        <Text style={styles.staticText}>{userData.username}</Text>
                    </View>

                    {/* Email */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email:</Text>
                        <TextInput
                            style={styles.input}
                            value={userData.email}
                            onChangeText={(text) =>
                                setUserData({ ...userData, email: text })
                            }
                            editable={isEditing}
                            placeholder="Correo electrónico"
                            placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        />
                    </View>

                    {/* Contraseña */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Contraseña:</Text>
                        <TextInput
                            style={styles.input}
                            value={userData.password}
                            onChangeText={(text) =>
                                setUserData({ ...userData, password: text })
                            }
                            secureTextEntry
                            editable={isEditing}
                            placeholder="Nueva contraseña"
                            placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        />
                    </View>

                    {/* Edad */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Edad:</Text>
                        <TextInput
                            style={styles.input}
                            value={userData.age}
                            onChangeText={(text) =>
                                setUserData({ ...userData, age: text })
                            }
                            keyboardType="numeric"
                            editable={isEditing}
                            placeholder="Edad"
                            placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        />
                    </View>

                    {/* Botón para editar o guardar */}
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

                    {/* Botón para seleccionar o tomar una foto */}
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
                        <Text style={styles.buttonText}>
                            Tomar o Seleccionar Foto
                        </Text>
                    </TouchableOpacity>

                    {/* Mostrar la foto de perfil si se ha seleccionado */}
                    {image && (
                        <Image
                            source={{ uri: image }}
                            style={styles.profileImage}
                        />
                    )}
                </View>
            </View>
        </ImageBackground>
    );
};

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
        width: '90%',  // Asegurando que el contenedor no esté limitado
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
    inputContainer: {
        marginBottom: 15,
        width: '100%',  // Asegurando que el contenedor del input ocupe todo el ancho
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: 'black',
        marginBottom: 5,
    },
    input: {
        width: '100%',  // El input ocupa el 100% del ancho del contenedor
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
    staticText: {
        fontSize: 16,
        color: 'black',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 10,
        borderRadius: 10,
    },
    button: {
        width: '100%',  // También aseguramos que los botones ocupen todo el ancho
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
    profileImage: {
        width: 200,
        height: 200,
        borderRadius: 100,
        marginTop: 20,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.7)',
    },
});


export default ProfileScreen;