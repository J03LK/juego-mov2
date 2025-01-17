import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Image,
    ImageBackground,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { getDatabase, ref, get, update } from 'firebase/database';
import { getAuth, updateEmail, updatePassword } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { token } from '../config/secrets';
import { Buffer } from 'buffer';

// Interfaces
interface UserData {
    username: string;
    email: string;
    password: string;
    age: string;
}

interface DropboxUploadResponse {
    path_display: string;
    name: string;
}

interface DropboxShareResponse {
    url: string;
    path: string;
}

interface DropboxError {
    error_summary?: string;
    status?: number;
}

const ProfileScreen: React.FC = () => {
    // Estado
    const [userData, setUserData] = useState<UserData>({
        username: '',
        email: '',
        password: '',
        age: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [userKey, setUserKey] = useState<string | null>(null);
    const [image, setImage] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState('');
    const [imageCount, setImageCount] = useState<number>(0);

    const auth = getAuth();
    const db = getDatabase();

    // Validadores
    const validateEmail = (email: string): boolean => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const validatePassword = (password: string): boolean => {
        return password.length >= 8;
    };

    const validateAge = (age: string): boolean => {
        const ageNum = parseInt(age);
        return !isNaN(ageNum) && ageNum > 0 && ageNum <= 120;
    };

    // Manejador de errores general
    const handleError = (error: unknown, defaultMessage: string) => {
        if (error instanceof Error) {
            Alert.alert('Error', error.message);
        } else if (typeof error === 'object' && error !== null) {
            const dropboxError = error as DropboxError;
            Alert.alert('Error', dropboxError.error_summary || defaultMessage);
        } else {
            Alert.alert('Error', defaultMessage);
        }
        console.error('Error detallado:', error);
    };

    // Subir imagen a Dropbox
    const subirImagen = async () => {
        if (!image) {
            Alert.alert('Error', 'Primero selecciona una imagen');
            return;
        }

        if (!token) {
            Alert.alert('Error', 'Token de acceso no disponible');
            return;
        }

        setIsUploading(true);

        try {
            const fileData = await FileSystem.readAsStringAsync(image, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const fileBuffer = Buffer.from(fileData, 'base64');
            if (typeof global.Buffer === 'undefined') {
                global.Buffer = Buffer;
            }

            const nextImageCount = imageCount + 1;
            const path = `/avatars/imagen${nextImageCount}.jpg`;

            const dropboxArg = {
                path,
                mode: 'overwrite',
                strict_conflict: false
            };

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Dropbox-API-Arg': JSON.stringify(dropboxArg),
                'Content-Type': 'application/octet-stream'
            };

            // Subir archivo
            const uploadResult = await axios<DropboxUploadResponse>({
                method: 'post',
                url: 'https://content.dropboxapi.com/2/files/upload',
                data: fileBuffer,
                headers,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            if (uploadResult.data?.path_display) {
                await createShareLink(uploadResult.data.path_display);
                setImageCount(nextImageCount);
            }
        } catch (error) {
            handleError(error, 'Error al subir la imagen');
        } finally {
            setIsUploading(false);
        }
    };

    // Crear enlace compartido
    const createShareLink = async (path: string) => {
        const shareData = {
            path,
            settings: {
                requested_visibility: { '.tag': 'public' },
                audience: { '.tag': 'public' },
                access: { '.tag': 'viewer' }
            }
        };

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        try {
            const result = await axios.post<DropboxShareResponse>(
                'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
                shareData,
                { headers }
            );

            if (result.data?.url) {
                const downloadUrl = result.data.url.replace('dl=0', 'raw=1');
                setImageUrl(downloadUrl);
                Alert.alert('Éxito', 'Imagen subida correctamente a Dropbox');
            }
        } catch (error: any) {
            if (error.response?.status === 409) {
                await handleExistingShareLink(path);
            } else {
                throw error;
            }
        }
    };

    // Manejar enlace compartido existente
    const handleExistingShareLink = async (path: string) => {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        try {
            const result = await axios.post(
                'https://api.dropboxapi.com/2/sharing/list_shared_links',
                { path },
                { headers }
            );

            if (result.data.links?.[0]?.url) {
                const existingUrl = result.data.links[0].url.replace('dl=0', 'raw=1');
                setImageUrl(existingUrl);
                Alert.alert('Éxito', 'Imagen subida correctamente a Dropbox');
            }
        } catch (error) {
            handleError(error, 'No se pudo obtener el enlace de la imagen existente');
        }
    };

    // Cargar datos del usuario
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
            handleError(error, 'No se pudieron cargar los datos del usuario');
        } finally {
            setIsLoading(false);
        }
    };

    // Guardar cambios
    const saveChanges = async () => {
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

            // Validaciones
            if (!validateEmail(userData.email)) {
                Alert.alert('Error', 'Por favor ingrese un email válido');
                return;
            }

            if (userData.password !== '********' && !validatePassword(userData.password)) {
                Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
                return;
            }

            if (!validateAge(userData.age)) {
                Alert.alert('Error', 'Por favor ingrese una edad válida (1-120)');
                return;
            }

            setIsLoading(true);
            const updates: Partial<UserData> = {};

            if (userData.email !== currentUser.email) {
                await updateEmail(currentUser, userData.email);
                updates.email = userData.email;
            }

            if (userData.password && userData.password !== '********') {
                await updatePassword(currentUser, userData.password);
            }

            updates.age = userData.age;
            updates.username = userData.username;

            if (Object.keys(updates).length > 0) {
                const userRef = ref(db, `users/${userKey}`);
                await update(userRef, updates);

                setUserData(prevData => ({
                    ...prevData,
                    ...updates,
                    password: '********'
                }));

                Alert.alert('Éxito', 'Perfil actualizado correctamente');
            }

            setIsEditing(false);
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                Alert.alert('Error', 'Por favor, cierre sesión y vuelva a iniciar sesión para actualizar sus datos.');
            } else {
                handleError(error, 'No se pudo actualizar el perfil');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Confirmar guardado
    const handleSave = () => {
        Alert.alert(
            'Confirmar cambios',
            '¿Estás seguro de que deseas guardar los cambios?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Guardar', onPress: saveChanges }
            ]
        );
    };

    // Cancelar edición
    const handleCancel = () => {
        Alert.alert(
            'Cancelar edición',
            '¿Estás seguro de que deseas cancelar los cambios?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí',
                    onPress: () => {
                        setIsEditing(false);
                        loadUserData();
                    }
                }
            ]
        );
    };

    // Seleccionar imagen de la cámara
    const pickImage = async () => {
        try {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraPermission.status !== 'granted') {
                Alert.alert('Error', 'Se necesitan permisos para usar la cámara.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled && result.assets[0].uri) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            handleError(error, 'Error al acceder a la cámara');
        }
    };

    // Seleccionar imagen de la galería
    const pickImageFromGallery = async () => {
        try {
            const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (mediaLibraryPermission.status !== 'granted') {
                Alert.alert('Error', 'Se necesitan permisos para acceder a la galería.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled && result.assets[0].uri) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            handleError(error, 'Error al acceder a la galería');
        }
    };

    useEffect(() => {
        loadUserData();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b5998" />
            </View>
        );
    }

    return (
        <ImageBackground
            source={require('../assets/perfil.png')}
            style={styles.img}
        >
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.overlay}>
                    <View style={styles.container}>
                        <Text style={styles.title}>Mi Perfil</Text>

                        {/* Username */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Username:</Text>
                            <Text style={styles.staticText}>{userData.username}</Text>
                        </View>

                        {/* Email */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email:</Text>
                            <TextInput
                                style={[styles.input, !isEditing && styles.disabledInput]}
                                value={userData.email}
                                onChangeText={(text) => setUserData({ ...userData, email: text })}
                                editable={isEditing}
                                placeholder="Correo electrónico"
                                placeholderTextColor="rgba(0, 0, 0, 0.5)"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Contraseña */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Contraseña:</Text>
                            <TextInput
                                style={[styles.input, !isEditing && styles.disabledInput]}
                                value={userData.password}
                                onChangeText={(text) => setUserData({ ...userData, password: text })}
                                secureTextEntry
                                editable={isEditing}
                                placeholder="Nueva contraseña"
                                placeholderTextColor="rgba(0, 0, 0, 0.5)"
                            />
                        </View>

                        {/* Edad */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Edad:</Text>
                            <TextInput
                                style={[styles.input, !isEditing && styles.disabledInput]}
                                value={userData.age}
                                onChangeText={(text) => setUserData({ ...userData, age: text })}
                                keyboardType="numeric"
                                editable={isEditing}
                                placeholder="Edad"
                                placeholderTextColor="rgba(0, 0, 0, 0.5)"
                                maxLength={3}
                            />
                        </View>

                        {/* Botones de edición */}
                        <View style={styles.buttonContainer}>
                            {!isEditing ? (
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={() => setIsEditing(true)}
                                >
                                    <Text style={styles.buttonText}>Editar Perfil</Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={[styles.button, styles.saveButton]}
                                        onPress={handleSave}
                                    >
                                        <Text style={styles.buttonText}>Guardar Cambios</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={handleCancel}
                                    >
                                        <Text style={styles.buttonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        {/* Selector de imagen */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => {
                                Alert.alert(
                                    'Selecciona una opción',
                                    '',
                                    [
                                        { text: 'Cancelar', style: 'cancel' },
                                        { text: 'Tomar una foto', onPress: pickImage },
                                        { text: 'Seleccionar de la galería', onPress: pickImageFromGallery },
                                    ]
                                );
                            }}
                        >
                            <Text style={styles.buttonText}>
                                {image ? 'Cambiar Foto' : 'Tomar o Seleccionar Foto'}
                            </Text>
                        </TouchableOpacity>

                        {/* Previsualización de imagen */}
                        {image && (
                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: image }}
                                    style={styles.profileImage}
                                />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => setImage(null)}
                                >
                                    <Text style={styles.removeImageText}>×</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Botón de subir imagen */}
                        {image && (
                            <TouchableOpacity
                                style={[styles.button, isUploading && styles.disabledButton]}
                                onPress={subirImagen}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.buttonText}>Subir Imagen</Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* URL de la imagen */}
                        {imageUrl && (
                            <Text style={styles.urlText} numberOfLines={2}>
                                Imagen subida: {imageUrl}
                            </Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
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
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    container: {
        width: '90%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginVertical: 20,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    inputContainer: {
        marginBottom: 15,
        width: '100%',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    input: {
        width: '100%',
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: 'white',
        color: '#333',
    },
    disabledInput: {
        backgroundColor: '#f5f5f5',
        color: '#666',
    },
    staticText: {
        fontSize: 16,
        color: '#333',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    buttonContainer: {
        width: '100%',
        marginVertical: 10,
    },
    button: {
        backgroundColor: '#3b5998',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginVertical: 8,
        width: '100%',
        alignItems: 'center',
        elevation: 2,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButton: {
        backgroundColor: '#f44336',
    },
    disabledButton: {
        backgroundColor: '#cccccc',
        opacity: 0.7,
    },
    buttonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '600',
    },
    imageContainer: {
        position: 'relative',
        marginVertical: 10,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#fff',
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#f44336',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    removeImageText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    urlText: {
        marginTop: 10,
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 10,
    },
});

export default ProfileScreen;