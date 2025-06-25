import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Alert,
	ScrollView,
	ActivityIndicator,
} from "react-native";
import userService from "../../api/userService";
import validator from "validator";
import styles from "../form.style";
import BackButton from "../../components/backNavigation";
import Mascot from "../../components/mascot";
import Input from "../../components/input";
import Button from "../../components/button";
import { NativeStackScreenProps } from "@react-navigation/native-stack";


type Props = NativeStackScreenProps<any, any>;
const ChangeEmailScreen = ({ navigation }: Props) => {
    const [newEmail, setNewEmail] = useState("");
    const [loading, setLoading] = useState(false);

	const handleChangeEmail = async () =>
{
		if (!newEmail)
{
			Alert.alert("Erreur", "Veuillez saisir une adresse e-mail.");
			return;
		}

		if (!validator.isEmail(newEmail))
{
			Alert.alert("Erreur", "Le format de l'e-mail est invalide.");
			return;
		}

		setLoading(true);

		try
{
			await userService.changeEmail({ newEmail });
			navigation.goBack();
		} catch (error) {
			console.error("Erreur changement email :", error);

			const message
				= error?.response?.data?.message || "Une erreur est survenue.";

			Alert.alert("Erreur", message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.scrollContainer}>
			<BackButton />
			<View style={styles.container}>
				<Mascot
					mascot="super"
					text="Un nouveau point de contact pour continuer notre aventure ensemble !"
				/>
				<View style={styles.formSection}>
					<Input
						placeholder="Nouvel e-mail"
						value={newEmail}
						onChangeText={setNewEmail}
						autoCapitalize="none"
						keyboardType="email-address"
					/>
				</View>
				<Button
					title={loading ? "Chargement..." : "Valider"}
					disabled={loading ? true : false}
					onPress={handleChangeEmail}
				/>
			</View>
		</ScrollView>
	);
};

export default ChangeEmailScreen;
