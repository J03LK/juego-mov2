import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ImageBackground,
    ImageSourcePropType,
    Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HangmanVisual } from '../components/HangmanVisual';
import { db } from '../config/firebase.config';
import { ref, get, update, child } from 'firebase/database';

const { width } = Dimensions.get('window');

interface WordHint {
    word: string;
    hint: string;
}

interface Level {
    words: WordHint[];
    background: ImageSourcePropType;
    usedWords?: Set<number>;
}

interface Levels {
    [key: number]: Level;
}

type RootStackParamList = {
    Login: undefined;
    Game: { username: string };
    Leaderboard: undefined;
};

type GameScreenProps = NativeStackScreenProps<RootStackParamList, 'Game'>;

const LEVELS: Levels = {
    1: {
        words: [
            { word: 'SOL', hint: 'Brilla en el cielo durante el día' },
            { word: 'LUZ', hint: 'Nos permite ver en la oscuridad' },
            { word: 'MAR', hint: 'Gran masa de agua salada' }
        ],
        background: require('../assets/level1.jpg'),
        usedWords: new Set(),
    },
    2: {
        words: [
            { word: 'CASA', hint: 'Lugar donde vivimos' },
            { word: 'MESA', hint: 'Mueble para comer o trabajar' },
            { word: 'SOPA', hint: 'Comida líquida caliente' }
        ],
        background: require('../assets/level2.jpg'),
        usedWords: new Set(),
    },
    3: {
        words: [
            { word: 'PLATO', hint: 'Utensilio para servir comida' },
            { word: 'LIBRO', hint: 'Contiene historias y conocimiento' },
            { word: 'PAPEL', hint: 'Material para escribir o dibujar' }
        ],
        background: require('../assets/level3.jpg'),
        usedWords: new Set(),
    },
    4: {
        words: [
            { word: 'VENTANA', hint: 'Permite ver hacia afuera de un edificio' },
            { word: 'BOTELLA', hint: 'Recipiente para líquidos' },
            { word: 'PESCADO', hint: 'Animal que vive en el agua' }
        ],
        background: require('../assets/level4.jpg'),
        usedWords: new Set(),
    },
    5: {
        words: [
            { word: 'CALENDARIO', hint: 'Nos ayuda a organizar el tiempo' },
            { word: 'BIBLIOTECA', hint: 'Lugar lleno de libros' },
            { word: 'COMPUTADORA', hint: 'Máquina para procesar información' }
        ],
        background: require('../assets/level5.jpg'),
        usedWords: new Set(),
    },
};

const LEVEL_TIME_LIMIT = 60;

export default function GameScreen({ route, navigation }: GameScreenProps) {
    const { username } = route.params;
    const userId = username.toLowerCase().replace(/\s+/g, '_');
    const [currentLevel, setCurrentLevel] = useState<number>(1);
    const [word, setWord] = useState<string>('');
    const [currentHint, setCurrentHint] = useState<string>(''); // Nuevo estado para la pista
    const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
    const [score, setScore] = useState<number>(0);
    const [wrongAttempts, setWrongAttempts] = useState<number>(0);
    const [wordsCompletedInLevel, setWordsCompletedInLevel] = useState<number>(0);
    const [timeRemaining, setTimeRemaining] = useState<number>(LEVEL_TIME_LIMIT);
    const [isGameActive, setIsGameActive] = useState<boolean>(true);
    const [usedWordsInLevel, setUsedWordsInLevel] = useState<number[]>([]); 

    useEffect(() => {
        startNewGame();
    }, [currentLevel]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isGameActive && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleTimeUp();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isGameActive, timeRemaining]);

    const updateUserScore = async (): Promise<boolean> => {
        try {
            const userRef = ref(db, `users/${userId}`);
            const snapshot = await get(userRef);
    
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const currentGameStats = userData.gameStats || {};
    
                const updatedGameStats = {
                    score: score,
                    gamesPlayed: (currentGameStats.gamesPlayed || 0) + 1,
                    highestScore: Math.max(currentGameStats.highestScore || 0, score),
                    lastGameDate: new Date().toISOString()
                };
    
                await update(ref(db, `users/${userId}/gameStats`), updatedGameStats);
    
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error actualizando puntaje:', error);
            return false;
        }
    };

    const handleEndGame = async (): Promise<void> => {
        setIsGameActive(false);
        await updateUserScore();
        
        Alert.alert(
            'Juego terminado',
            `¡${username}, tu puntaje final es: ${score}!`,
            [
                {
                    text: 'Ver Ranking',
                    onPress: () => navigation.navigate('Leaderboard')
                },
            ]
        );
    };

    const startNewGame = (): void => {
        const levelData = LEVELS[currentLevel];
        const availableIndices = Array.from(Array(levelData.words.length).keys())
            .filter(index => !usedWordsInLevel.includes(index));

        let wordIndex: number;
        
        if (availableIndices.length === 0) {
            setUsedWordsInLevel([]);
            wordIndex = Math.floor(Math.random() * levelData.words.length);
        } else {
            wordIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            setUsedWordsInLevel(prev => [...prev, wordIndex]);
        }

        const selectedWord = levelData.words[wordIndex];
        setWord(selectedWord.word);
        setCurrentHint(selectedWord.hint); // Asegura que la pista se actualice
        setGuessedLetters(new Set());
        setWrongAttempts(0);
        setTimeRemaining(LEVEL_TIME_LIMIT);
        setIsGameActive(true);
    };

    const handleTimeUp = (): void => {
        handleEndGame();
    };

    const handleLevelComplete = (): void => {
        if (currentLevel < 5) {
            Alert.alert(
                '¡Nivel Completado!',
                `¡Felicitaciones, ${username}! Has completado el nivel ${currentLevel}`,
                [
                    {
                        text: 'Siguiente Nivel',
                        onPress: () => {
                            setCurrentLevel((prev) => prev + 1);
                            setWordsCompletedInLevel(0);
                            setUsedWordsInLevel([]);
                        },
                    },
                ]
            );
        } else {
            handleEndGame();
        }
    };

    const guessLetter = (letter: string): void => {
        if (!isGameActive || guessedLetters.has(letter)) return;

        const newGuessedLetters = new Set(guessedLetters);
        newGuessedLetters.add(letter);
        setGuessedLetters(newGuessedLetters);

        if (!word.includes(letter)) {
            const newWrongAttempts = wrongAttempts + 1;
            setWrongAttempts(newWrongAttempts);
            
            if (newWrongAttempts >= 6) {
                handleEndGame();
                return;
            }
        } else {
            const isWinner = [...word].every((char) => newGuessedLetters.has(char));
            if (isWinner) {
                const pointsForWord = 100 * currentLevel;
                setScore((prev) => prev + pointsForWord);
                
                setWordsCompletedInLevel((prev) => {
                    const newWordsCompleted = prev + 1;
                    if (newWordsCompleted >= 3) {
                        setTimeout(handleLevelComplete, 500);
                    }
                    return newWordsCompleted;
                });

                Alert.alert(
                    '¡Palabra Completada!',
                    `¡Conseguiste ${pointsForWord} puntos!`,
                    [{ text: 'Siguiente palabra', onPress: startNewGame }]
                );
            }
        }
    };

    const getDisplayWord = (): string =>
        [...word].map((letter) => (guessedLetters.has(letter) ? letter : '_')).join(' ');

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleExitGame = (): void => {
        Alert.alert(
            'Salir del juego',
            '¿Estás seguro que deseas salir? Perderás tu progreso actual.',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Salir',
                    onPress: () => {
                        handleEndGame();
                        navigation.navigate('Login');
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    return (
        <ImageBackground
            source={LEVELS[currentLevel].background}
            style={styles.container}
        >
            <View style={[styles.overlay, { backgroundColor: 'rgba(255, 255, 255, 0.5)' }]}>
                {/* Botones de Salir y Ranking */}
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleExitGame}
                    >
                        <Text style={styles.headerButtonText}>🚪 Salir</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('Leaderboard')}
                    >
                        <Text style={styles.headerButtonText}>🏆 Ranking</Text>
                    </TouchableOpacity>
                </View>

                {/* Información del nivel */}
                <Text style={styles.levelText}>Nivel {currentLevel}</Text>
                <Text style={styles.timer}>⏱️ {formatTime(timeRemaining)}</Text>
                <Text style={styles.score}>Puntuación: {score}</Text>
                <Text style={styles.progress}>Palabras: {wordsCompletedInLevel}/3</Text>

                {/* Visualización de la pista */}
                <View style={styles.hintContainer}>
                    <Text style={styles.hintText}>Pista: {currentHint}</Text>
                </View>

                <HangmanVisual wrongAttempts={wrongAttempts} />

                <Text style={styles.word}>{getDisplayWord()}</Text>

                <View style={styles.keyboard}>
                    {'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').map((letter) => (
                        <TouchableOpacity
                            key={letter}
                            style={[styles.letter, guessedLetters.has(letter) && styles.letterUsed]}
                            onPress={() => guessLetter(letter)}
                            disabled={guessedLetters.has(letter)}
                        >
                            <Text
                                style={[styles.letterText, guessedLetters.has(letter) && styles.letterUsedText]}
                            >
                                {letter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    headerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
    },
    headerButton: {
        padding: 10,
        backgroundColor: '#007AFF',
        borderRadius: 10,
    },
    headerButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    levelText: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 60,
        color: '#333',
    },
    timer: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 5,
        color: '#333',
    },
    score: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 5,
        color: '#333',
    },
    progress: {
        fontSize: 20,
        marginBottom: 20,
        color: '#333',
    },
    word: {
        fontSize: 36,
        letterSpacing: 5,
        marginVertical: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    keyboard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 20,
    },
    letter: {
        width: 40,
        height: 40,
        margin: 3,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
    },
    letterUsed: {
        backgroundColor: '#ccc',
    },
    letterText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    letterUsedText: {
        color: '#ccc',
    },
    hintContainer: {
        backgroundColor: '#ccc',
        padding: 10,
        borderRadius: 10,
        marginVertical: 10,
        width: '90%',
    },
    hintText: {
        color: 'black',
        fontSize: 16,
        textAlign: 'center',
    },
});
