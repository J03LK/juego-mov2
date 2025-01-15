import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';

export default function GithubScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  type RootStackParamList = {
    Login: undefined;
    Game: undefined;
    Leaderboard: undefined;
    Github: undefined;
  };

  return (
    <ImageBackground source={require('../assets/github.png')} style={styles.img}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Cuentas de Github</Text>

          <View style={styles.card}>
            <Text style={styles.account}>
              Yadira Palomo: <Text style={styles.username}>yadilis</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.account}>
              Heydi Herrera: <Text style={styles.username}>heydi20</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.account}>
              Kevin Lasluisa: <Text style={styles.username}>J03LK</Text>
            </Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  img: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    //backgroundColor: 'rgba(0, 0, 0, 0.7)', // Capa oscurecida para contraste
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    padding: 20,
    borderRadius: 15,
    //backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fondo translúcido para las tarjetas
    //shadowColor: '#000',
    //shadowOffset: { width: 0, height: 4 },
    //shadowOpacity: 0.3,
    //shadowRadius: 5,
    //elevation: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white', // Dorado vibrante
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 2,
    //textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Fondo más claro para las tarjetas
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  account: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  username: {
    fontWeight: 'bold',
    color: '#1a73e8',
    textDecorationLine: 'underline', // Subrayado para destacar los nombres de usuario
  },
});
