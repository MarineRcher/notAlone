import { StatusBar } from "expo-status-bar";
import { registerRootComponent } from "expo";
import AppNavigator from "./src/navigation/AppNavigator";
import { useAuthCheck } from "./src/context/AuthContext";

function App() {
    useAuthCheck();
    return (
        <>
            <AppNavigator />
            <StatusBar style="auto" />
        </>
    );
}

registerRootComponent(App);

export default App;
