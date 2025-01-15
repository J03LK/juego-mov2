import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { ref, query, orderByChild, limitToLast, get } from 'firebase/database';
import { db } from '../config/firebase.config';
import { auth } from '../config/firebase.config';
import { Video } from 'expo-av';


interface UserScore {
    id: string;
    username: string;
    score: number;
    gamesPlayed: number;
}

export default function LeaderboardScreen() {
    const [scores, setScores] = useState<UserScore[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            const usersRef = ref(db, 'users');
            const snapshot = await get(usersRef);

            if (snapshot.exists()) {
                const leaderboardData: UserScore[] = [];

                snapshot.forEach((child) => {
                    const data = child.val();
                    console.log('Raw user data:', data); // Para debugging

                    // Accedemos a los datos correctamente a través de gameStats
                    leaderboardData.push({
                        id: child.key || '',
                        username: data.username || 'Usuario',
                        score: data.gameStats?.score || 0,
                        gamesPlayed: data.gameStats?.gamesPlayed || 0
                    });
                });

                // Ordenamos por puntuación de mayor a menor
                const sortedData = leaderboardData.sort((a, b) => b.score - a.score);
                console.log('Sorted leaderboard data:', sortedData); // Para debugging

                setScores(sortedData);
            } else {
                console.log('No hay datos disponibles');
                setScores([]);
            }
        } catch (error) {
            console.error('Error cargando el leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item, index }: { item: UserScore; index: number }) => (
        <View style={styles.scoreRow}>
            <Text style={styles.position}>{index + 1}</Text>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.score}>{item.score}</Text>
            <Text style={styles.gamesPlayed}>{item.gamesPlayed} juegos</Text>
        </View>
    );

    if (loading) {
        return (
            <View>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Video
                source={require('../assets/trofeo.mp4')}
                style={styles.backgroundVideo}
                shouldPlay
                isLooping
                isMuted
                rate={0.5}
                volume={0}
            />
            <View style={styles.overlay}>
                <Text style={styles.title}>Tabla de Puntuaciones</Text>

                {scores.length > 0 ? (
                    <>
                        <View style={styles.headerRow}>
                            <Text style={styles.headerPosition}>#</Text>
                            <Text style={styles.headerUsername}>Usuario</Text>
                            <Text style={styles.headerScore}>Puntos</Text>
                            <Text style={styles.headerGames}>Juegos</Text>
                        </View>

                        <FlatList
                            data={scores}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContainer}
                        />
                    </>
                ) : (
                    <Text style={styles.noDataText}>No hay puntuaciones disponibles</Text>
                )}
            </View>
        </View>
    );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Fondo negro
    },
    backgroundVideo: {
        width: width,
        height: height,
        position: 'absolute',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo más oscuro para contraste
        padding: 16,
        justifyContent: 'center', // Centrar contenido verticalmente
    },
    title: {
        fontSize: 28, // Tamaño de fuente más grande
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#fff', // Texto blanco
        marginTop: 20, // Espaciado desde arriba
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
        fontFamily: 'Courier New',
        textTransform: 'uppercase',
    },
    headerRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
        marginBottom: 10,
    },
    headerPosition: {
        width: '10%',
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    headerUsername: {
        width: '40%',
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'left',
    },
    headerScore: {
        width: '25%',
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#fff',
    },
    headerGames: {
        width: '25%',
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#fff',
    },
    listContainer: {
        paddingBottom: 20,
        marginHorizontal: 16, // Margen para separar la tabla de los bordes
    },
    scoreRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
    },
    position: {
        width: '10%',
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
    },
    username: {
        width: '40%',
        fontSize: 16,
        color: '#fff',
    },
    score: {
        width: '25%',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    gamesPlayed: {
        width: '25%',
        textAlign: 'center',
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    noDataText: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 20,
        color: '#fff',
    },
});
