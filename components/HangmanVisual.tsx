// components/HangmanVisual.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface HangmanVisualProps {
    wrongAttempts: number;
}

const HANGMAN_PARTS = [
    // Cabeza (cara feliz/triste según estado)
    ({ color, isGameOver }: { color: string; isGameOver: boolean }) => (
        <G>
            <Circle cx="100" cy="50" r="10" stroke={color} strokeWidth="4" fill="white" />
            {/* Ojos */}
            <Circle cx="95" cy="47" r="1.5" fill={color} />
            <Circle cx="105" cy="47" r="1.5" fill={color} />
            {/* Boca (feliz o triste) */}
            {isGameOver ? 
                <Path
                    d="M95 55 Q100 52 105 55"
                    stroke={color}
                    strokeWidth="1.5"
                    fill="none"
                /> :
                <Path
                    d="M95 53 Q100 56 105 53"
                    stroke={color}
                    strokeWidth="1.5"
                    fill="none"
                />
            }
        </G>
    ),
    // Cuerpo (torso con forma)
    ({ color }: { color: string }) => (
        <Path
            d="M100 60 C100 75 95 90 100 100"
            stroke={color}
            strokeWidth="4"
            fill="none"
        />
    ),
    // Brazo izquierdo
    ({ color }: { color: string }) => (
        <Path
            d="M100 75 Q85 80 75 85"
            stroke={color}
            strokeWidth="4"
            fill="none"
        />
    ),
    // Brazo derecho
    ({ color }: { color: string }) => (
        <Path
            d="M100 75 Q115 80 125 85"
            stroke={color}
            strokeWidth="4"
            fill="none"
        />
    ),
    // Pierna izquierda
    ({ color }: { color: string }) => (
        <Path
            d="M100 100 Q90 115 80 130"
            stroke={color}
            strokeWidth="4"
            fill="none"
        />
    ),
    // Pierna derecha
    ({ color }: { color: string }) => (
        <Path
            d="M100 100 Q110 115 120 130"
            stroke={color}
            strokeWidth="4"
            fill="none"
        />
    ),
];

export const HangmanVisual: React.FC<HangmanVisualProps> = ({ wrongAttempts }) => {
    const isGameOver = wrongAttempts >= HANGMAN_PARTS.length;
    const color = isGameOver ? 'red' : 'black';

    return (
        <View style={styles.container}>
            <Svg height="200" width="200" viewBox="0 0 200 200">
                {/* Base mejorada */}
                <G>
                    {/* Base con perspectiva */}
                    <Path
                        d="M40 160 L160 160 L150 170 L50 170 Z"
                        fill="#8B4513"
                        stroke="black"
                        strokeWidth="2"
                    />
                    {/* Poste vertical con sombra */}
                    <Path
                        d="M60 20 L60 160 L65 165 L65 25 Z"
                        fill="#8B4513"
                        stroke="black"
                        strokeWidth="2"
                    />
                    {/* Soporte diagonal */}
                    <Path
                        d="M60 60 L80 160"
                        stroke="#8B4513"
                        strokeWidth="4"
                    />
                    {/* Poste horizontal superior */}
                    <Path
                        d="M60 20 L100 20 L100 25 L65 25 Z"
                        fill="#8B4513"
                        stroke="black"
                        strokeWidth="2"
                    />
                    {/* Cuerda */}
                    <Path
                        d="M100 20 Q100 25 100 40"
                        stroke="#866"
                        strokeWidth="2"
                    />
                </G>

                {/* Partes del muñeco */}
                {HANGMAN_PARTS.slice(0, wrongAttempts).map((Part, index) => (
                    <Part 
                        key={index} 
                        color={color} 
                        isGameOver={isGameOver}
                    />
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