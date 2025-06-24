import { StatusBar } from "expo-status-bar";
import { registerRootComponent } from "expo";
// Initialize crypto polyfills for React Native
import "react-native-get-random-values";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import {
	useFonts as useQuicksand,
	Quicksand_400Regular,
	Quicksand_700Bold,
} from "@expo-google-fonts/quicksand";
import {
	useFonts as useBalsamiq,
	BalsamiqSans_400Regular,
	BalsamiqSans_700Bold,
} from "@expo-google-fonts/balsamiq-sans";
import { ActivityIndicator, View } from "react-native";
import colors from "./src/css/colors";

function App() 
{
	const [quicksandLoaded] = useQuicksand({
		Quicksand_400Regular,
		Quicksand_700Bold,
	});

	const [balsamiqLoaded] = useBalsamiq({
		BalsamiqSans_400Regular,
		BalsamiqSans_700Bold,
	});

	const fontsLoaded = quicksandLoaded && balsamiqLoaded;

	if (!fontsLoaded) 
{
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<AuthProvider>
			<AppNavigator />
			<StatusBar style="auto" />
		</AuthProvider>
	);
}

registerRootComponent(App);

export default App;
