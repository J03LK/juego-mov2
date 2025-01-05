// components/HangmanVisual.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, G } from 'react-native-svg';

interface HangmanVisualProps {
    wrongAttempts: number;
}

const HANGMAN_PARTS = [
    // Cabeza
    ({ color }: { color: string }) => (
        <Circle cx="100" cy="50" r="10" stroke={color} strokeWidth="4" fill="none" />
    ),
    // Cuerpo
    ({ color }: { color: string }) => (
        <Line x1="100" y1="60" x2="100" y2="100" stroke={color} strokeWidth="4" />
    ),
    // Brazo izquierdo
    ({ color }: { color: string }) => (
        <Line x1="100" y1="75" x2="75" y2="85" stroke={color} strokeWidth="4" />
    ),
    // Brazo derecho
    ({ color }: { color: string }) => (
        <Line x1="100" y1="75" x2="125" y2="85" stroke={color} strokeWidth="4" />
    ),
    // Pierna izquierda
    ({ color }: { color: string }) => (
        <Line x1="100" y1="100" x2="80" y2="130" stroke={color} strokeWidth="4" />
    ),
    // Pierna derecha
    ({ color }: { color: string }) => (
        <Line x1="100" y1="100" x2="120" y2="130" stroke={color} strokeWidth="4" />
    ),
];

export const HangmanVisual: React.FC<HangmanVisualProps> = ({ wrongAttempts }) => {
    return (
        <View style={styles.container}>
            <Svg height="200" width="200" viewBox="0 0 200 200">
                {/* Base */}
                <G>
                    {/* Poste horizontal base */}
                    <Line x1="40" y1="160" x2="160" y2="160" stroke="black" strokeWidth="4" />
                    {/* Poste vertical */}
                    <Line x1="60" y1="20" x2="60" y2="160" stroke="black" strokeWidth="4" />
                    {/* Poste horizontal superior */}
                    <Line x1="60" y1="20" x2="100" y2="20" stroke="black" strokeWidth="4" />
                    {/* Cuerda */}
                    <Line x1="100" y1="20" x2="100" y2="40" stroke="black" strokeWidth="4" />
                </G>

                {/* Partes del cuerpo */}
                {HANGMAN_PARTS.slice(0, wrongAttempts).map((Part, index) => (
                    <Part key={index} color={wrongAttempts === 6 ? 'red' : 'black'} />
                ))}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
});