import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import './global.css';
import { RootNavigator } from './src/navigation/RootNavigator';

/**
 * Entry. The order of providers is intentional:
 *   1. GestureHandlerRootView — required by react-native-gesture-handler.
 *   2. SafeAreaProvider — safe-area context consumed by all screens.
 *   3. RootNavigator — owns NavigationContainer + auth-state branching.
 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
