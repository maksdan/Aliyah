import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import { requestPermissionAndSchedule } from './src/services/notifications';

export default function App() {
  // Keter YG (Culmus) rather than a general-purpose Hebrew face: it carries the
  // Tiro Typeworks Biblical Hebrew layout logic, so ta'amim stack clear of the
  // niqud instead of colliding with them. See assets/fonts/LICENSE-KeterYG.txt.
  const [fontsLoaded, fontError] = useFonts({
    KeterYG_Regular: require('./assets/fonts/KeterYG-Medium.ttf'),
    KeterYG_Bold: require('./assets/fonts/KeterYG-Bold.ttf'),
  });

  useEffect(() => {
    requestPermissionAndSchedule();
  }, []);

  // Never trap the reader behind a spinner: if the font fails to load, fall
  // through to the system Hebrew face rather than hanging forever.
  if (!fontsLoaded && !fontError) {
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
