
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { HangmanVisual } from '../components/HangmanVisual';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc, increment } from 'firebase/firestore';

const WORDS = ['LEER', 'MUNDO', 'CUADERNO', 'PIE', 'MUJER', 'HOMBRE'];

export default function GameScreen() {
    const [word, setWord] = useState('');
    const [guessedLetters, setGuessedLetters] = useState(new Set<string>());
    const [score, setScore] = useState(0);
    const [wrongAttempts, setWrongAttempts] = useState(0);

    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = () => {
        setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
        setGuessedLetters(new Set());
        setWrongAttempts(0);
    };

    const guessLetter = (letter: string) => {
        if (guessedLetters.has(letter)) return;

        const newGuessedLetters = new Set(guessedLetters);
        newGuessedLetters.add(letter);
        setGuessedLetters(newGuessedLetters);

        if (!word.includes(letter)) {
            setWrongAttempts(prev => prev + 1);
            if (wrongAttempts + 1 >= 6) {
                Alert.alert('¡Perdiste!', `La palabra era: ${word}`, [
                    { text: 'Jugar de nuevo', onPress: startNewGame }
                ]);
            }
        } else {
           
            


            const isWinner = [...word].every(char => newGuessedLetters.has(char));
            if (isWinner) {
                const newScore = score + 100;
                setScore(newScore);
                Alert.alert('¡Ganaste!', `¡Conseguiste 100 puntos!`, [
                    { text: 'Siguiente palabra', onPress: startNewGame }
                ]);
            }
        }
    };

    const getDisplayWord = () => {
        return [...word].map(letter => guessedLetters.has(letter) ? letter : '_').join(' ');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.score}>Puntuación: {score}</Text>

            <HangmanVisual wrongAttempts={wrongAttempts} />

            <Text style={styles.word}>{getDisplayWord()}</Text>

            <View style={styles.keyboard}>
                {'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').map(letter => (
                    <TouchableOpacity
                        key={letter}
                        style={[
                            styles.letter,
                            guessedLetters.has(letter) && styles.letterUsed
                        ]}
                        onPress={() => guessLetter(letter)}
                        disabled={guessedLetters.has(letter)}
                    >
                        <Text style={styles.letterText}>{letter}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    score: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    word: {
        fontSize: 36,
        letterSpacing: 5,
        marginVertical: 20,
        fontWeight: 'bold',
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
});