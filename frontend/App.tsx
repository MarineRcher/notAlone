import { StatusBar } from "expo-status-bar";
import { registerRootComponent } from "expo";
import AppNavigator from "./src/navigation/AppNavigator";
import { useAuthCheck } from "./src/context/AuthContext";
import { initApiClient } from "./src/api/apiInstance";
import { useEffect } from "react";

function App() {
    useEffect(() => {
        initApiClient();
    }, []);

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
