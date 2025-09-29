import React, { useContext, useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	StyleSheet,
	ScrollView,
} from "react-native";
import { AuthContext, User } from "../../context/AuthContext";
import userService from "../../api/userService";
import { jwtDecode } from "jwt-decode";
import Button from "../../components/button";
import styles from "../form.style";
import BackButton from "../../components/backNavigation";
import Mascot from "../../components/mascot";
import Feature from "../../components/feature";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any, any>;
const ActivatePremiumScreen = ({ navigation }: Props) => {
	const { setUser } = useContext(AuthContext);
	const [loading, setLoading] = useState(false);

	const handleActivate = async () => {
		try {
			setLoading(true);
			const response = await userService.activatePremium();

			if (response.token) {
				const decoded = jwtDecode<User>(response.token);

				setUser(decoded);
			}
			Alert.alert("Succès", "Version premium activée !");
			navigation.goBack();
		} catch (error) {
			console.error("Erreur premium:", error);
			Alert.alert("Erreur", "Impossible d'activer la version premium");
		} finally {
			setLoading(false);
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.scrollContainer}>
			<BackButton />
			<View style={styles.container}>
				<Mascot
					mascot="woaw"
					text="Prêt à booster ton aventure ? Découvre les fonctionnalités exclusives du premium !"
				/>

				<View style={styles.formSection}>
					<Feature feature="Plus d'arbres et de fleurs pour construire une forêt plus diversifiée" />
					<Feature feature="Plus d'accès aux bénéfices acquis et en cours d'acquisition" />
					<Feature feature="La possibilité de gérer plusieurs arrêts d'addiction" />
					<Feature feature="Accès à l'atelier de respiration illimité" />
					<Feature feature="Plus de questions de suivi dans le journal" />
				</View>
				<Button
					title={loading ? "Chargement..." : "Activer version Premium"}
					onPress={handleActivate}
					disabled={loading}
				/>
			</View>
		</ScrollView>
	);
};

export default ActivatePremiumScreen;
