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
            Alert.alert("Succès", "Inscription réussie!");
            navigation.navigate("Login");
        } catch (error) {
            let errorMessage = "Une erreur est survenue lors de l'inscription";
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
                        placeholder="Entrez votre login"
                        value={login}
                        onChangeText={handleLoginChange}
                        autoCapitalize="none"
                    />
                    {errors.login ? <Text>{errors.login}</Text> : null}
                </View>

                <View>
                    <Text>Email</Text>
                    <TextInput
                        placeholder="Entrez votre email"
                        value={email}
                        onChangeText={handleEmailChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    {errors.email ? <Text>{errors.email}</Text> : null}
                </View>

                <View>
                    <Text>Mot de passe</Text>
                    <TextInput
                        placeholder="Entrez votre mot de passe"
                        value={password}
                        onChangeText={handlePasswordChange}
                        secureTextEntry
                    />
                    {errors.password ? <Text>{errors.password}</Text> : null}
                </View>

                <View>
                    <Text>Confirmer le mot de passe</Text>
                    <TextInput
                        placeholder="Confirmez votre mot de passe"
                        value={confirmPassword}
                        onChangeText={handlePasswordConfirmChange}
                        secureTextEntry
                    />
                    {errors.confirmPassword ? (
                        <Text>{errors.confirmPassword}</Text>
                    ) : null}
                </View>

                <TouchableOpacity onPress={handleRegister} disabled={isLoading}>
                    <Text>{isLoading ? "Chargement..." : "S'inscrire"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation && navigation.navigate("Login")}
                >
                    <Text>Déjà inscrit? Se connecter</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default RegisterScreen;
