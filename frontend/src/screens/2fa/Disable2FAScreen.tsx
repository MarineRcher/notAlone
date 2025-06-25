import React, { useState, useEffect, useContext } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Alert,
	ScrollView,
} from "react-native";
import { authService } from "../../api/authService";
import { authHelpers } from "../../api/authHelpers";
import { jwtDecode } from "jwt-decode";
import validator from "validator";
import { AuthContext, User } from "../../context/AuthContext";
import styles from "../form.style";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import Input from "../../components/input";
import BackButton from "../../components/backNavigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError } from "../../types/auth";

type Props = NativeStackScreenProps<any, any>;

const Disable2FAScreen = ({ navigation }: Props) => {
    const [otp, setOtp] = useState("");
    const [userId, setUserId] = useState<number | null>(null);
    const { setUser } = useContext(AuthContext);

	useEffect(() =>
{
		const fetchUserId = async () =>
{
			const token = await authHelpers.getToken();

			if (!token)
{
				Alert.alert("Erreur", "Vous devez être connecté");
				navigation.navigate("Login");
				return;
			}

			const decoded = jwtDecode<User>(token);

			setUser(decoded);
			setUserId(decoded.id);
		};

		fetchUserId();
	}, []);

	const handleDisable = async () =>
{
		if (!validator.isNumeric(otp) || otp.length !== 6)
{
			Alert.alert("Erreur", "Le code doit être à 6 chiffres");
			return;
		}

		if (!userId)
{
			Alert.alert("Erreur", "Utilisateur non identifié");
			return;
		}

		try
{
			const response = await authService.disable2FA({
				userId: userId.toString(),
				otp,
			});

			if (response?.data?.token)
{
				await authHelpers.saveToken(response.data.token);
				const decoded = jwtDecode<User>(response.data.token);

				setUser(decoded);
			}

            Alert.alert("Succès", "2FA désactivée");
            navigation.goBack();
        } catch (error) {
            const apiError = error as ApiError;
            Alert.alert(
                "Erreur",
                apiError?.response?.data?.message || "Échec de la désactivation"
            );
        }
    };

	return (
		<ScrollView contentContainerStyle={styles.scrollContainer}>
			<BackButton />
			<View style={styles.container}>
				<Mascot
					mascot="happy"
					text="Tu veux ranger ton double des clés ? Assure-toi que ton terrier reste bien gardé."
				/>
				<View style={styles.formWrapper}>
					<Text>
						Entrez le code de vérification pour désactiver la 2FA :
					</Text>
					<Input
						placeholder="Entrez le code de vérification"
						value={otp}
						onChangeText={setOtp}
						keyboardType="numeric"
					/>
				</View>
				<Button title="Désactiver" onPress={handleDisable} />
			</View>
		</ScrollView>
	);
};

export default Disable2FAScreen;
