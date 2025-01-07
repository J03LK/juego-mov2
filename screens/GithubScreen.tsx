import { StyleSheet, Text, View } from 'react-native' 
import React from 'react' 
import { NavigationProp, useNavigation } from '@react-navigation/native'; 
 
export default function GithubScreen() { 
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); 
  type RootStackParamList = { 
    Login: undefined; 
    Game: undefined; 
    Leaderboard: undefined; 
    Github:undefined 
}; 
 
 
  return ( 
    <View style={styles.container}> 
      <Text style={styles.title}>Cuentas de Github</Text> 
      <Text style={styles.account}>Yadira Palomo: <Text style={styles.username}>yadilis</Text></Text> 
      <Text style={styles.account}>Heydi Herrera: <Text style={styles.username}>heydi20</Text></Text> 
      <Text style={styles.account}>Kevin Lasluisa: <Text style={styles.username}>J03LK</Text></Text> 
    </View> 
  ) 
} 
 
const styles = StyleSheet.create({ 
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5', 
    padding: 20, 
  }, 
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 20, 
  }, 
  account: { 
    fontSize: 18, 
    color: '#555', 
    marginVertical: 5, 
  }, 
  username: { 
    fontWeight: 'bold', 
    color: '#0066cc', 
  } 
})