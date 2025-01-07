import { StyleSheet, Text, View } from 'react-native';
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F7FF',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: '90%',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  account: {
    fontSize: 18,
    color: '#333',
  },
  username: {
    fontWeight: 'bold',
    color: '#1a73e8',
  },
});
