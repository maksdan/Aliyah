import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import { requestPermissionAndSchedule } from './src/services/notifications';

export default function App() {
  // Taamey Frank CLM (Culmus): Rafael Frank's 1908 Frank-Ruehl, the classical
  // Hebrew book face, in the Taamey cut that carries the Tiro Typeworks
  // Biblical Hebrew layout logic — so ta'amim stack clear of the niqud instead
  // of colliding with them. See assets/fonts/LICENSE-Culmus.txt.
  const [fontsLoaded, fontError] = useFonts({
    TaameyFrank_Regular: require('./assets/fonts/TaameyFrankCLM-Medium.ttf'),
    TaameyFrank_Bold: require('./assets/fonts/TaameyFrankCLM-Bold.ttf'),
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
