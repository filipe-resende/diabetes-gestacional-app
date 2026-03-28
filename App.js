import 'react-native-gesture-handler';
import React, { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

import GlassTabBar    from './src/navigation/TabBar';
import LoadingScreen  from './src/components/LoadingScreen';
import HomeScreen     from './src/screens/HomeScreen';
import HistoryScreen  from './src/screens/HistoryScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import ProfileScreen  from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function withFade(Screen) {
  return function FadedScreen(props) {
    const opacity = useRef(new Animated.Value(0)).current;

    useFocusEffect(
      useCallback(() => {
        opacity.setValue(0);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }).start();
      }, [])
    );

    return (
      <Animated.View style={{ flex: 1, opacity }}>
        <Screen {...props} />
      </Animated.View>
    );
  };
}

const FadedHome     = withFade(HomeScreen);
const FadedHistory  = withFade(HistoryScreen);
const FadedInsights = withFade(InsightsScreen);
const FadedProfile  = withFade(ProfileScreen);

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          tabBar={(props) => <GlassTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Home"     component={FadedHome} />
          <Tab.Screen name="History"  component={FadedHistory} />
          <Tab.Screen name="Insights" component={FadedInsights} />
          <Tab.Screen name="Profile"  component={FadedProfile} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
