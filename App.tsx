import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { db } from './config/firebase.config';
import LoginScreen from './screens/LoginScreen';
import GameScreen from './screens/GameScreen';
import RegisterScreen from './screens/RegisterScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import GithubScreen from './screens/GithubScreen';

// Definir los tipos para la navegación
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Game: { username: string };
  Leaderboard: undefined;
  Github:undefined
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="Github" component={GithubScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
