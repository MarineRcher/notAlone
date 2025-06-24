import React, { useContext, useState } from "react";
import { View, Text, TextInput, Alert, ScrollView } from "react-native";
import { authService } from "../../api/authService";
import validator from "validator";
import { authHelpers } from "../../api/authHelpers";
import { AuthContext, User } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import styles from "../form.style";
import BackButton from "../../components/backNavigation";
import Input from "../../components/input";

const TwoFactorLoginScreen = ({ route, navigation }) => 
{
	const { setUser } = useContext(AuthContext);
	const [otp, setOtp] = useState("");
	const { tempToken } = route.params;

	const handleVerify = async () => 
{
		try 
{
			if (!validator.isNumeric(otp) || otp.length !== 6) 
{
				Alert.alert("Erreur", "Le code doit être à 6 chiffres");
				return;
			}
			const response = await authService.verify2FALogin({
				tempToken,
				otp,
			});

			await authHelpers.saveToken(response.data.token);
			const decoded = jwtDecode<User>(response.data.token);

			setUser(decoded);
			navigation.navigate("Main");
		} catch (error) {
			Alert.alert(
				"Erreur",
				error.response?.data?.message || "Code invalide"
			);
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.scrollContainer}>
			<BackButton />

			<View style={styles.container}>
				<Mascot
					mascot="super"
					text="Un renard avisé sécurise toujours son terrier… "
				/>
				<View style={styles.formWrapper}>
					<Input
						placeholder="Entrez le code de vérification"
						value={otp}
						onChangeText={setOtp}
						keyboardType="numeric"
					/>
				</View>
				<Button title="Vérifier" onPress={handleVerify} />
			</View>
		</ScrollView>
	);
};

export default TwoFactorLoginScreen;
