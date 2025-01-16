import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ImageBackground,
    ImageSourcePropType,
    Dimensions,
    Vibration,
    Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HangmanVisual } from '../components/HangmanVisual';
import { db } from '../config/firebase.config';
import { ref, get, update } from 'firebase/database';


const { width } = Dimensions.get('window');

interface GameSounds {
    correct: Audio.Sound | null;
    incorrect: Audio.Sound | null;
    win: Audio.Sound | null;
    lose: Audio.Sound | null;
    levelUp: Audio.Sound | null;
}

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
    Profile: { username: string };
};

type GameScreenProps = NativeStackScreenProps<RootStackParamList, 'Game'>;

const LEVELS: Levels = {
    1: {
        words: [
            { word: 'SOL', hint: 'Brilla en el cielo durante el día' },
            { word: 'LUZ', hint: 'Nos permite ver en la oscuridad' },
            { word: 'MAR', hint: 'Gran masa de agua salada' },
            { word: 'CIELO', hint: 'Está sobre nosotros y es azul durante el día' },
            { word: 'ESTRELLA', hint: 'Brilla en la noche y está muy lejos' },
            { word: 'NUBE', hint: 'Flota en el cielo y a veces trae lluvia' },
            { word: 'VIENTO', hint: 'Corriente de aire' },
            { word: 'FUEGO', hint: 'Produce calor y luz' },
            { word: 'TIERRA', hint: 'Planeta donde vivimos' },
            { word: 'LUNA', hint: 'Satélite natural de la Tierra' }
        ],
        background: require('../assets/level1.jpg'),
        usedWords: new Set(),
    },
    2: {
        words: [
            { word: 'CASA', hint: 'Lugar donde vivimos' },
            { word: 'MESA', hint: 'Mueble para comer o trabajar' },
            { word: 'SOPA', hint: 'Comida líquida caliente' },
            { word: 'SILLA', hint: 'Mueble para sentarse' },
            { word: 'PUERTA', hint: 'Entrada a una habitación o edificio' },
            { word: 'VENTANA', hint: 'Permite ver hacia afuera' },
            { word: 'CAMA', hint: 'Donde dormimos' },
            { word: 'LÁMPARA', hint: 'Fuente de luz artificial' },
            { word: 'COCINA', hint: 'Lugar donde se prepara comida' },
            { word: 'ESCALERA', hint: 'Se usa para subir o bajar entre niveles' }
        ],
        background: require('../assets/level2.jpg'),
        usedWords: new Set(),
    },
    3: {
        words: [
            { word: 'PLATO', hint: 'Utensilio para servir comida' },
            { word: 'LIBRO', hint: 'Contiene historias y conocimiento' },
            { word: 'PAPEL', hint: 'Material para escribir o dibujar' },
            { word: 'CUADERNO', hint: 'Conjunto de hojas para escribir' },
            { word: 'BOLÍGRAFO', hint: 'Se usa para escribir con tinta' },
            { word: 'REGLA', hint: 'Se usa para medir distancias' },
            { word: 'TIJERA', hint: 'Herramienta para cortar' },
            { word: 'MOCHILA', hint: 'Bolsa para llevar objetos personales' },
            { word: 'ESCRITORIO', hint: 'Mueble para trabajar o estudiar' },
            { word: 'SILLÓN', hint: 'Asiento cómodo con respaldo y apoyabrazos' }
        ],
        background: require('../assets/level3.jpg'),
        usedWords: new Set(),
    },
    4: {
        words: [
            { word: 'VENTANA', hint: 'Permite ver hacia afuera de un edificio' },
            { word: 'BOTELLA', hint: 'Recipiente para líquidos' },
            { word: 'PESCADO', hint: 'Animal que vive en el agua' },
            { word: 'TELÉFONO', hint: 'Se usa para comunicarse a distancia' },
            { word: 'LLAVE', hint: 'Se usa para abrir puertas' },
            { word: 'CUCHARA', hint: 'Utensilio para comer líquidos' },
            { word: 'ESPEJO', hint: 'Refleja la imagen de quien lo mira' },
            { word: 'TOALLA', hint: 'Se usa para secarse' },
            { word: 'ZAPATO', hint: 'Se usa para proteger los pies' },
            { word: 'CÁMARA', hint: 'Dispositivo para tomar fotos' }
        ],
        background: require('../assets/level4.jpg'),
        usedWords: new Set(),
    },
    5: {
        words: [
            { word: 'CALENDARIO', hint: 'Nos ayuda a organizar el tiempo' },
            { word: 'BIBLIOTECA', hint: 'Lugar lleno de libros' },
            { word: 'COMPUTADORA', hint: 'Máquina para procesar información' },
            { word: 'AURICULAR', hint: 'Se usa para escuchar sin molestar a otros' },
            { word: 'MOUSE', hint: 'Dispositivo para mover el cursor en la pantalla' },
            { word: 'TECLADO', hint: 'Se usa para escribir en la computadora' },
            { word: 'MONITOR', hint: 'Pantalla de computadora' },
            { word: 'IMPRESORA', hint: 'Dispositivo para imprimir documentos' },
            { word: 'SOFTWARE', hint: 'Programas que usa una computadora' },
            { word: 'ALFOMBRA', hint: 'Se coloca en el suelo para decorar o aislar' }
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

    const initialSounds: GameSounds = {
        correct: null,
        incorrect: null,
        win: null,
        lose: null,
        levelUp: null,
    };

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
    const shakeAnimation = useRef(new Animated.Value(0)).current;
    // Función para crear la animación de shake
    const shake = () => {
        // Configuración del patrón de vibración (en milisegundos)
        Vibration.vibrate([0, 500, 200, 500]);

        // Secuencia de animación de shake
        Animated.sequence([
            ...Array(4).fill(null).flatMap(() => [
                Animated.timing(shakeAnimation, {
                    toValue: -10,
                    duration: 100,
                    useNativeDriver: true
                }),
                Animated.timing(shakeAnimation, {
                    toValue: 10,
                    duration: 100,
                    useNativeDriver: true
                })
            ]),
            Animated.timing(shakeAnimation, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true
            })
        ]).start();
    };

    // Modifica tus funciones existentes para incluir los sonidos
    const handleEndGame = async (): Promise<void> => {
        setIsGameActive(false);
        await updateUserScore();
        await playSound('lose');
        shake(); // Añadimos el efecto de shake

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

        // Obtener índices de palabras disponibles que no han sido usadas
        const availableIndices = Array.from(
            Array(levelData.words.length).keys()
        ).filter(index => !usedWordsInLevel.includes(index));

        let wordIndex: number;

        // Verificar si hay palabras disponibles sin usar
        if (availableIndices.length === 0) {
            // Si todas las palabras han sido usadas, reiniciar la lista de palabras usadas
            setUsedWordsInLevel([]);
            // Elegir cualquier palabra al azar
            wordIndex = Math.floor(Math.random() * levelData.words.length);
        } else {
            // Elegir una palabra de los índices disponibles
            wordIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            // Marcar la palabra como usada
            setUsedWordsInLevel(prev => [...prev, wordIndex]);
        }

        // Seleccionar la palabra y actualizar el estado
        const selectedWord = levelData.words[wordIndex];
        setWord(selectedWord.word);
        setCurrentHint(selectedWord.hint);
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
            playSound('incorrect');
            const newWrongAttempts = wrongAttempts + 1;
            setWrongAttempts(newWrongAttempts);

            if (newWrongAttempts >= 6) {
                handleEndGame();
                return;
            }
        } else {
            playSound('correct');
            const isWinner = [...word].every((char) => newGuessedLetters.has(char));
            if (isWinner) {
                playSound('win');
                const pointsForWord = 100 * currentLevel; // Define pointsForWord aquí
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

    const [sounds, setSounds] = useState<GameSounds>({
        correct: null,
        incorrect: null,
        win: null,
        lose: null,
        levelUp: null,
    });

    // Cargar los sonidos al iniciar
    useEffect(() => {
        async function loadSounds() {
            try {
                const correctSound = new Audio.Sound();
                const incorrectSound = new Audio.Sound();
                const winSound = new Audio.Sound();
                const loseSound = new Audio.Sound();
                const levelUpSound = new Audio.Sound();

                await correctSound.loadAsync(require('../assets/sounds/correct.mp3'));
                await incorrectSound.loadAsync(require('../assets/sounds/incorrect.mp3'));
                await winSound.loadAsync(require('../assets/sounds/win.mp3'));
                await loseSound.loadAsync(require('../assets/sounds/lose.mp3'));
                await levelUpSound.loadAsync(require('../assets/sounds/level-up.mp3'));

                setSounds({
                    correct: correctSound,
                    incorrect: incorrectSound,
                    win: winSound,
                    lose: loseSound,
                    levelUp: levelUpSound,
                });
            } catch (error) {
                console.error('Error cargando sonidos:', error);
            }
        }

        loadSounds();

        // Cleanup function
        return () => {
            Object.values(sounds).forEach(async (sound) => {
                if (sound) {
                    await sound.unloadAsync();
                }
            });
        };
    }, []);

    // Función para reproducir sonidos
    const playSound = async (soundType: keyof GameSounds) => {
        try {
            const sound = sounds[soundType];
            if (sound) {
                await sound.setPositionAsync(0);
                await sound.playAsync();
            }
        } catch (error) {
            console.error('Error reproduciendo sonido:', error);
        }
    };

    const qwertyRows = [
        'QWERTYUIOP',
        'ASDFGHJKLÑ',
        'ZXCVBNM',
    ];

    return (
        <ImageBackground
            source={LEVELS[currentLevel].background}
            style={styles.container}
        >
            <Animated.View
                style={[
                    styles.overlay,
                    {
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        transform: [{
                            translateX: shakeAnimation
                        }]
                    }
                ]}
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
                            onPress={() => navigation.navigate('Profile', { username })}
                        >
                            <Text style={styles.headerButtonText}>📜 Perfil</Text>
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
                        {qwertyRows.map((row, rowIndex) => (
                            <View key={rowIndex} style={styles.letterRow}>
                                {row.split('').map((letter) => (
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
                        ))}
                    </View>

                </View>

            </Animated.View>
        </ImageBackground>
    );
};

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
        marginTop: 20, // Cambié `position: absolute` por `marginTop` para evitar empujar otros elementos
        width: '100%',
        paddingHorizontal: 20,
    },
    headerButton: {
        padding: 10,
        backgroundColor: '#007AFF',
        borderRadius: 10,
        marginBottom: 10, // Espacio abajo
        marginLeft: 20,    // Espacio a la izquierda
        marginRight: 5
    },
    headerButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    levelText: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 20, // Menor espacio después de los botones
        color: '#333',
        textAlign: 'center',
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
        fontWeight: 'bold',
        color: '#333',
    },
    keyboard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 30, // Mantenerlo ajustado para que esté más abajo
        paddingHorizontal: 20, // Incrementado para añadir más espacio horizontal
    },
    letter: {
        width: 35, // Reducido para que las teclas sean más pequeñas
        height: 35,
        margin: 4, // Ajustado para mejorar la separación entre teclas
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10, // Mantener las esquinas redondeadas
    },
    letterUsed: {
        backgroundColor: '#ccc',
    },
    letterText: {
        color: 'white',
        fontSize: 18, // Reducido para que el texto se ajuste mejor en teclas más pequeñas
        fontWeight: 'bold',
    },
    letterUsedText: {
        color: 'black',
    },
    letterRow: {
        flexDirection: 'row',
        justifyContent: 'center',
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
