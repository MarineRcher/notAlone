import { StatusBar } from 'expo-status-bar';
import { registerRootComponent } from 'expo';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

registerRootComponent(App);

export default App;
