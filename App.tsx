import { NotoSerifHebrew_400Regular, NotoSerifHebrew_700Bold, useFonts } from '@expo-google-fonts/noto-serif-hebrew';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import { requestPermissionAndSchedule } from './src/services/notifications';

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSerifHebrew_400Regular,
    NotoSerifHebrew_700Bold,
  });

  useEffect(() => {
    requestPermissionAndSchedule();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF6E3' }}>
        <ActivityIndicator color="#8B4513" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <HomeScreen />
    </>
  );
}
