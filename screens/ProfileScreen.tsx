import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ImageBackground, ScrollView } from 'react-native';
import { getDatabase, ref, get, update } from 'firebase/database';
import { getAuth, updateEmail, updatePassword } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { token } from '../config/secrets';
import { Buffer } from 'buffer';

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
    const [imageUrl, setImageUrl] = useState("");
    const [imageCount, setImageCount] = useState<number>(0);

    const auth = getAuth();
    const db = getDatabase();

    // Subir imagen a Dropbox y obtener el enlace de la imagen
    const subirImagen = async () => {
        if (!image) {
            Alert.alert('Error', 'Primero selecciona una imagen');
            return;
        }
    
        // Asegurarse de que tenemos un token válido
        if (!token) {
            Alert.alert('Error', 'Token de acceso no disponible');
            return;
        }
    
        const ACCESS_TOKEN = token;
        setIsLoading(true);
    
        try {
            // Convertir la imagen a Base64
            const fileData = await FileSystem.readAsStringAsync(image, {
                encoding: FileSystem.EncodingType.Base64,
            });
    
            const fileBuffer = Buffer.from(fileData, 'base64');
            const nextImageCount = imageCount + 1;
    
            // Configuración para la carga de archivos
            const dropboxArg = {
                path: `/avatars/imagen${nextImageCount}.jpg`,
                mode: 'overwrite',
                strict_conflict: false
            };
    
            // Headers específicos para la carga de archivos
            const headers = {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Dropbox-API-Arg': JSON.stringify(dropboxArg),
                'Content-Type': 'application/octet-stream'
            };
    
            try {
                // Subir el archivo
                const result = await axios({
                    method: 'post',
                    url: 'https://content.dropboxapi.com/2/files/upload',
                    data: fileBuffer,
                    headers: headers,
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                });
    
                if (result.data && result.data.path_display) {
                    // Crear el enlace compartido
                    const shareData = {
                        path: result.data.path_display,
                        settings: {
                            requested_visibility: { '.tag': 'public' },
                            audience: { '.tag': 'public' },
                            access: { '.tag': 'viewer' }
                        }
                    };
    
                    const shareHeaders = {
                        'Authorization': `Bearer ${ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    };
    
                    try {
                        const sharedLinkResult = await axios.post(
                            'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
                            shareData,
                            { headers: shareHeaders }
                        );
    
                        if (sharedLinkResult.data && sharedLinkResult.data.url) {
                            const downloadUrl = sharedLinkResult.data.url.replace('dl=0', 'raw=1');
                            setImageUrl(downloadUrl);
                            setImageCount(nextImageCount);
                            Alert.alert('Éxito', 'Imagen subida correctamente a Dropbox');
                        }
                    } catch (shareError: any) {
                        // Si el enlace ya existe, intentar obtener el enlace existente
                        if (shareError.response?.status === 409) {
                            try {
                                const listLinksResult = await axios.post(
                                    'https://api.dropboxapi.com/2/sharing/list_shared_links',
                                    { path: result.data.path_display },
                                    { headers: shareHeaders }
                                );
    
                                if (listLinksResult.data.links && listLinksResult.data.links.length > 0) {
                                    const existingUrl = listLinksResult.data.links[0].url.replace('dl=0', 'raw=1');
                                    setImageUrl(existingUrl);
                                    setImageCount(nextImageCount);
                                    Alert.alert('Éxito', 'Imagen subida correctamente a Dropbox');
                                }
                            } catch (listError) {
                                throw new Error('No se pudo obtener el enlace de la imagen existente');
                            }
                        } else {
                            throw shareError;
                        }
                    }
                }
            } catch (error: any) {
                let errorMessage = 'Error al subir la imagen';
                
                if (error.response) {
                    switch (error.response.status) {
                        case 401:
                            errorMessage = 'Error de autenticación. Token inválido o expirado.';
                            break;
                        case 403:
                            errorMessage = 'No tienes permiso para realizar esta acción.';
                            break;
                        case 429:
                            errorMessage = 'Demasiadas solicitudes. Intenta más tarde.';
                            break;
                        default:
                            errorMessage = `Error ${error.response.status}: ${error.response.data?.error_summary || 'Error desconocido'}`;
                    }
                }
                
                Alert.alert('Error', errorMessage);
                console.error('Error detallado:', error);
            }
        } catch (error) {
            Alert.alert('Error', 'Hubo un problema al procesar la imagen');
            console.error('Error general:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
            source={require('../assets/perfil.png')}
            style={styles.img}
        >
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
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

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => {
                                Alert.alert('Selecciona una opción', '', [
                                    { text: 'Cancelar', style: 'cancel' },
                                    { text: 'Tomar una foto', onPress: pickImage },
                                    { text: 'Seleccionar de la galería', onPress: pickImageC },

                                ]);
                            }}
                        >
                            <Text style={styles.buttonText}>
                                Tomar o Seleccionar Foto
                            </Text>
                        </TouchableOpacity>

                        {image && (
                            <Image
                                source={{ uri: image }}
                                style={styles.profileImage}
                            />
                        )}
                        
                        <TouchableOpacity
                            style={styles.button}
                            onPress={subirImagen}
                        >
                            <Text style={styles.buttonText}>Subir Imagen</Text>
                        </TouchableOpacity>

                        {imageUrl && (
                            <Text style={styles.urlText}>
                                URL de la Imagen: {imageUrl}
                            </Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    img: {
        flex: 1,
        resizeMode: 'cover',
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
        marginVertical: 20,
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
        width: '100%',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: 'black',
        marginBottom: 5,
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
    staticText: {
        fontSize: 16,
        color: 'black',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 10,
        borderRadius: 10,
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
    profileImage: {
        width: 200,
        height: 200,
        borderRadius: 100,
        marginTop: 20,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.7)',
    },
    urlText: {
        marginTop: 10,
        color: '#333',
        fontSize: 14,
        textAlign: 'center',
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 5,
        width: '100%',
    },
});

export default ProfileScreen;