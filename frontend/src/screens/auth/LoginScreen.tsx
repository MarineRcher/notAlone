import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
} from "react-native";

import { authService } from "../../api/authService";

const LoginScreen = ({ navigation }) => {
    const [loginOrEmail, setLoginOrEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({
        login: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const validateForm = () => {
        let isValid = true;
        const newErrors = { loginOrEmail: "", password: "" };

        if (!loginOrEmail.trim()) {
            newErrors.loginOrEmail = "Le login ou l'email est requis";
            isValid = false;
        } else {
            if (loginOrEmail.includes("@")) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(loginOrEmail)) {
                    newErrors.loginOrEmail = "Format d'email invalide";
                    isValid = false;
                }
            } else {
                const loginRegex = /^[a-zA-Z0-9_-]{3,20}$/;
                if (!loginRegex.test(loginOrEmail)) {
                    newErrors.loginOrEmail =
                        "Login invalide (caractères autorisés: a-z, 0-9, -, _)";
                    isValid = false;
                }
            }
        }

        if (!password) {
            newErrors.password = "Le mot de passe est requis";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleLogin = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.login({
                loginOrEmail,
                password,
            });

            if (response.data.requiresTwoFactor) {
                navigation.navigate("TwoFactorLogin", {
                    tempToken: response.data.tempToken,
                });
            } else {
                Alert.alert("Succès", "Connexion réussie !");
            }
        } catch (error) {
            let errorMessage = "Une erreur est survenue lors de la connexion";
            console.log(error);
            if (error.response) {
                errorMessage = error.response.data.message || errorMessage;
            }

            Alert.alert("Erreur", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView>
            <View>
                <Text>Créer un compte</Text>

                <View>
                    <Text>Login</Text>
                    <TextInput
                        placeholder="Entrez votre login ou email"
                        value={loginOrEmail}
                        onChangeText={(text) =>
                            setLoginOrEmail(text.replace(/[<>]/g, ""))
                        }
                        autoCapitalize="none"
                    />
                    {errors.login ? <Text>{errors.login}</Text> : null}
                </View>

                <View>
                    <Text>Mot de passe</Text>
                    <TextInput
                        placeholder="Entrez votre mot de passe"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    {errors.password ? <Text>{errors.password}</Text> : null}
                </View>

                <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
                    <Text>{isLoading ? "Chargement..." : "Se connecter"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() =>
                        navigation && navigation.navigate("Register")
                    }
                >
                    <Text>Vous n'evez pas de compte ? S\'inscrire</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() =>
                        navigation && navigation.navigate("ChangePassword")
                    }
                >
                    <Text>
                        Vous avez oubliez votre mot de passe ? Changer de mot de
                        passe
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() =>
                        navigation && navigation.navigate("Enable2FA")
                    }
                >
                    <Text>Activer 2FA</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate("Disable2FA")}
                >
                    <Text>Désactiver la 2FA</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default LoginScreen;
