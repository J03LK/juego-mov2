import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { ref, query, orderByChild, limitToLast, get } from 'firebase/database';
import { db } from '../config/firebase.config';

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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
        marginBottom: 10,
    },
    headerPosition: {
        width: 40,
        fontWeight: 'bold',
    },
    headerUsername: {
        flex: 2,
        fontWeight: 'bold',
    },
    headerScore: {
        width: 70,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    headerGames: {
        width: 80,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    listContainer: {
        paddingBottom: 20,
    },
    scoreRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        alignItems: 'center',
    },
    position: {
        width: 40,
        fontSize: 16,
    },
    username: {
        flex: 2,
        fontSize: 16,
    },
    score: {
        width: 70,
        textAlign: 'right',
        fontSize: 16,
        fontWeight: 'bold',
    },
    gamesPlayed: {
        width: 80,
        textAlign: 'right',
        fontSize: 14,
        color: '#666',
    },
    noDataText: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 20,
        color: '#666',
    },
});