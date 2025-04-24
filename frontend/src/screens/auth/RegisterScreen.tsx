import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
} from "react-native";
import axios from "axios";
import authService from "../../api/authService";

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

        // Validation du login
        if (!login.trim()) {
            newErrors.login = "Le login est requis";
            isValid = false;
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            newErrors.email = "L'email est requis";
            isValid = false;
        } else if (!emailRegex.test(email)) {
            newErrors.email = "Format d'email invalide";
            isValid = false;
        }

        // Validation du mot de passe (utilisant le même regex que le backend)
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/;
        if (!password) {
            newErrors.password = "Le mot de passe est requis";
            isValid = false;
        } else if (!passwordRegex.test(password)) {
            newErrors.password =
                "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial";
            isValid = false;
        }

        // Confirmation du mot de passe
        if (password !== confirmPassword) {
            newErrors.confirmPassword =
                "Les mots de passe ne correspondent pas";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleRegister = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            await authService.register({
                login,
                email,
                password,
                hasPremium: false,
                has2FA: false,
                isBlocked: false,
            });
            Alert.alert("Succès", "Inscription réussie!");
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
                        onChangeText={(text) =>
                            setLogin(text.replace(/[<>]/g, ""))
                        }
                        autoCapitalize="none"
                    />
                    {errors.login ? <Text>{errors.login}</Text> : null}
                </View>

                <View>
                    <Text>Email</Text>
                    <TextInput
                        placeholder="Entrez votre email"
                        value={email}
                        onChangeText={(text) =>
                            setEmail(text.replace(/[<>]/g, ""))
                        }
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
                        onChangeText={(text) =>
                            setPassword(text.replace(/[<>]/g, ""))
                        }
                        secureTextEntry
                    />
                    {errors.password ? <Text>{errors.password}</Text> : null}
                </View>

                <View>
                    <Text>Confirmer le mot de passe</Text>
                    <TextInput
                        placeholder="Confirmez votre mot de passe"
                        value={confirmPassword}
                        onChangeText={(text) =>
                            setConfirmPassword(text.replace(/[<>]/g, ""))
                        }
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
