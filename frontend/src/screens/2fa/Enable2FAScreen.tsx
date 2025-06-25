import React, { useState, useEffect, useContext } from "react";
import {
	View,
	Text,
	Image,
	TextInput,
	TouchableOpacity,
	Alert,
	ScrollView,
} from "react-native";
import { authService } from "../../api/authService";
import * as Clipboard from "expo-clipboard";
import validator from "validator";
import { authHelpers } from "../../api/authHelpers";
import { jwtDecode } from "jwt-decode";
import { AuthContext, User } from "../../context/AuthContext";
import Mascot from "../../components/mascot";
import styles from "../form.style";
import Button from "../../components/button";
import Input from "../../components/input";
import BackButton from "../../components/backNavigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any, any>;
const Enable2FAScreen = ({ navigation, route }: Props) => {
    const isFromRegistration = route?.params?.isFromRegistration || false;

	const [qrCodeUrl, setQrCodeUrl] = useState("");
	const [otp, setOtp] = useState("");
	const [tempToken, setTempToken] = useState("");
	const [secretKey, setSecretKey] = useState("");

	const { setUser } = useContext(AuthContext);

	const generate2FASecret = async () =>
{
		try
{
			const response = await authService.generate2FASecret();

			setQrCodeUrl(response.data.qrCodeUrl);
			setTempToken(response.data.tempToken);
			setSecretKey(response.data.secret);
		} catch (error) {
			Alert.alert("Erreur", "Échec de la génération du secret 2FA");
		}
	};

	const verifySetup = async () =>
{
		try
{
			if (!validator.isNumeric(otp) || otp.length !== 6)
{
				Alert.alert("Erreur", "Le code doit être à 6 chiffres");
				return;
			}

			const response = await authService.verify2FASetup({
				token: tempToken,
				otp,
			});

			if (response.data.newToken)
{
				await authHelpers.saveToken(response.data.newToken);
				const decoded = jwtDecode<User>(response.data.newToken);

				setUser(decoded);
			}

			if (isFromRegistration)
{
				navigation.navigate("AddUserAddiction");
			} else {
				navigation.navigate("Main");
			}
		} catch (error) {
			Alert.alert("Erreur", "Code invalide ou expiré");
		}
	};

	useEffect(() =>
{
		generate2FASecret();
	}, []);

	return (
		<ScrollView contentContainerStyle={styles.scrollContainer}>
			<BackButton />

			<View style={styles.container}>
				<Mascot
					mascot="super"
					text="Nouvelle clé pour ton terrier. Ta sécurité, c’est sacré ici."
				/>
				<View style={styles.formWrapper}>
					<Text>Scannez ce QR Code avec Google Authenticator :</Text>
					{qrCodeUrl && (
						<Image
							source={{ uri: qrCodeUrl }}
							style={{ width: 200, height: 200 }}
						/>
					)}
					<TouchableOpacity
						style={styles.inlineLinkLogin}
						onPress={async () =>
{
							await Clipboard.setStringAsync(secretKey);
							Alert.alert("Succès", "Clé copiée !");
						}}
					>
						<Text style={styles.link}>Copier la clé.</Text>
						<Text>Ne partagez jamais cette clé</Text>
					</TouchableOpacity>

					<Input
						placeholder="Entrez le code de vérification"
						value={otp}
						onChangeText={setOtp}
						keyboardType="numeric"
					/>
				</View>
				<Button title="Vérifier" onPress={verifySetup} />
			</View>
		</ScrollView>
	);
};

export default Enable2FAScreen;
