import React, { useState } from "react";
import validator from "validator";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
} from "react-native";
import { authService } from "../../api/authService";
import Button from "../../components/button";
import Input from "../../components/input";
import Mascot from "../../components/mascot";
import styles from "./RegisterScreen.style";

const RegisterScreen = ({ navigation }) => {
    const [login, setLogin] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({
        login: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            login: "",
            email: "",
            password: "",
            confirmPassword: "",
        };

        if (!login.trim()) {
            newErrors.login = "Le login est requis";
            isValid = false;
        } else if (!validator.matches(login, /^[a-zA-Z0-9_-]{3,20}$/)) {
            newErrors.login =
                "Login invalide (caractères autorisés: a-z, 0-9, -, _)";
            isValid = false;
        }

        if (!email.trim()) {
            newErrors.email = "L'email est requis";
            isValid = false;
        } else if (!validator.isEmail(email)) {
            newErrors.email = "Format d'email invalide";
            isValid = false;
        }

        if (!password) {
            newErrors.password = "Le mot de passe est requis";
            isValid = false;
        } else if (
            !validator.isStrongPassword(password, {
                minLength: 12,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })
        ) {
            newErrors.password =
                "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial";
            isValid = false;
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword =
                "Les mots de passe ne correspondent pas";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleLoginChange = (text: string) => {
        setLogin(text);
    };

    const handleEmailChange = (text: string) => {
        setEmail(text);
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
    };

    const handlePasswordConfirmChange = (text: string) => {
        setConfirmPassword(text);
    };

    const handleRegister = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const sanitizedLogin = validator.escape(login.trim());
            const normalizedEmail = validator.normalizeEmail(email) || email;

            await authService.register({
                login: sanitizedLogin,
                email: normalizedEmail,
                password,
                hasPremium: false,
                has2FA: false,
                isBlocked: false,
            });
            navigation.navigate("Ask2fa", { isFromRegistration: true });
        } catch (error) {
            let errorMessage = "Une erreur est survenue lors de l'inscription";

            if (error.response) {
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
                    text="Bienvenue dans la clairière ! Chaque grande aventure commence par un premier pas."
                />

                <View style={styles.formWrapper}>
                    <View style={styles.formSection}>
                        <Input
                            placeholder="Entrez votre login"
                            value={login}
                            onChangeText={handleLoginChange}
                            autoCapitalize="none"
                            error={
                                errors.login ? (
                                    <Text>{errors.login}</Text>
                                ) : null
                            }
                        />
                        <Input
                            placeholder="Entrez votre email"
                            value={email}
                            onChangeText={handleEmailChange}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            error={
                                errors.email ? (
                                    <Text>{errors.email}</Text>
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
                        <Input
                            placeholder="Confirmez votre mot de passe"
                            value={confirmPassword}
                            onChangeText={handlePasswordConfirmChange}
                            error={
                                errors.confirmPassword ? (
                                    <Text>{errors.confirmPassword}</Text>
                                ) : null
                            }
                            secureTextEntry
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.inlineLink}
                        onPress={() =>
                            navigation && navigation.navigate("Login")
                        }
                    >
                        <Text>Vous avez un compte ? </Text>
                        <Text style={styles.link}>Connectez-vous</Text>
                    </TouchableOpacity>
                </View>
                <Button
                    title={isLoading ? "Chargement..." : "S'inscrire"}
                    disabled={isLoading ? true : false}
                    onPress={handleRegister}
                />
            </View>
        </ScrollView>
    );
};

export default RegisterScreen;
