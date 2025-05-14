import { StatusBar } from "expo-status-bar";
import { registerRootComponent } from "expo";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";

function App() {
    return (
        <AuthProvider>
            <AppNavigator />
            <StatusBar style="auto" />
        </AuthProvider>
    );
}

registerRootComponent(App);

export default App;
