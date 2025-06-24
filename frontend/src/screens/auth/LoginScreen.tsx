import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Alert,
	ScrollView,
} from "react-native";
import validator from "validator";

import { authService } from "../../api/authService";
import styles from "../form.style";
import Mascot from "../../components/mascot";
import Input from "../../components/input";
import Button from "../../components/button";

const LoginScreen = ({ navigation }) => 
{
	const [loginOrEmail, setLoginOrEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState({
		loginOrEmail: "",
		password: "",
	});

	const handleLoginOrEmailChange = (text: string) => 
{
		setLoginOrEmail(text.trim());
	};

	const handlePasswordChange = (text: string) => 
{
		setPassword(text);
	};

	const validateForm = () => 
{
		let isValid = true;
		const newErrors = { loginOrEmail: "", password: "" };

		if (!loginOrEmail.trim()) 
{
			newErrors.loginOrEmail = "Le login ou l'email est requis";
			isValid = false;
		} else if (loginOrEmail.includes("@")) {
			if (!validator.isEmail(loginOrEmail)) 
{
				newErrors.loginOrEmail = "Format d'email invalide";
				isValid = false;
			}
		} else {
			if (!validator.matches(loginOrEmail, /^[a-zA-Z0-9_-]{3,20}$/)) 
{
				newErrors.loginOrEmail =
					"Login invalide (caractères autorisés: a-z, 0-9, -, _)";
				isValid = false;
			}
		}

		if (!password) 
{
			newErrors.password = "Le mot de passe est requis";
			isValid = false;
		}

		setErrors(newErrors);
		return isValid;
	};

	const handleLogin = async () => 
{
		if (!validateForm()) 
{
			return;
		}

		setIsLoading(true);

		try 
{
			const response = await authService.login({
				loginOrEmail,
				password,
			});

			if (response.data.requiresTwoFactor) 
{
				navigation.navigate("TwoFactorLogin", {
					tempToken: response.data.tempToken,
				});
			} else {
				navigation.navigate("Ask2fa");
			}
		} catch (error) {
			let errorMessage = "Une erreur est survenue lors de la connexion";

			console.log(error);
			if (error.response) 
{
				errorMessage = error.response.data.message || errorMessage;
			}

			Alert.alert("Erreur", errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.scrollContainer}>
			<View style={styles.container}>
				<Mascot
					mascot="hey"
					text="J’ai quitté mon terrier rien que pour toi. Prêt à avancer ensemble ?"
				/>

				<View style={styles.formWrapper}>
					<View style={styles.formSection}>
						<Input
							placeholder="Entrez votre login ou email"
							value={loginOrEmail}
							onChangeText={handleLoginOrEmailChange}
							autoCapitalize="none"
							error={
								errors.loginOrEmail ? (
									<Text>{errors.loginOrEmail}</Text>
								) : null
							}
						/>
						<Input
							placeholder="Entrez votre mot de passe"
							value={password}
							onChangeText={handlePasswordChange}
							error={
								errors.password ? (
									<Text>{errors.password}</Text>
								) : null
							}
							secureTextEntry
						/>
					</View>

					<TouchableOpacity
						style={styles.inlineLinkLogin}
						onPress={() =>
							navigation && navigation.navigate("Register")
						}
					>
						<Text style={styles.text}>
							Vous n'avez pas de compte ?
						</Text>
						<Text style={styles.link}>S'inscrire</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.inlineLinkLogin}
						onPress={() =>
							navigation && navigation.navigate("ChangePassword")
						}
					>
						<Text style={styles.text}>
							Vous avez oubliez votre mot de passe ?
						</Text>
						<Text style={styles.link}>Changer de mot de passe</Text>
					</TouchableOpacity>
				</View>
				<Button
					title={isLoading ? "Chargement..." : "Se connecter"}
					disabled={isLoading ? true : false}
					onPress={handleLogin}
				/>
			</View>
		</ScrollView>
	);
};

export default LoginScreen;
