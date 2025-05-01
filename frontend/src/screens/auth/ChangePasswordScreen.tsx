import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
} from "react-native";
import authService from "../../api/authService";

const ChangePasswordScreen = ({ navigation }) => {
    const [loginOrEmail, setLoginOrEmail] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({
        loginOrEmail: "",
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            loginOrEmail: "",
            oldPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        };

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
        // Validation du mot de passe (utilisant le même regex que le backend)
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/;
        if (!newPassword) {
            newErrors.newPassword = "Le mot de passe est requis";
            isValid = false;
        } else if (!passwordRegex.test(newPassword)) {
            newErrors.newPassword =
                "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial";
            isValid = false;
        }

        // Confirmation du mot de passe
        if (newPassword !== confirmNewPassword) {
            newErrors.confirmNewPassword =
                "Les mots de passe ne correspondent pas";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChangePassword = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            await authService.changePassword({
                loginOrEmail,
                oldPassword,
                newPassword,
            });
            Alert.alert("Succès", "Changement de mot de passe réussie!");
        } catch (error) {
            let errorMessage =
                "Une erreur est survenue lors du changement de mot de passe";
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
                <Text>Changer de mot de passe</Text>

                <View>
                    <Text>Login ou Email</Text>
                    <TextInput
                        placeholder="Entrez votre login ou email"
                        value={loginOrEmail}
                        onChangeText={(text) =>
                            setLoginOrEmail(text.replace(/[<>]/g, ""))
                        }
                        autoCapitalize="none"
                    />
                    {errors.loginOrEmail ? (
                        <Text>{errors.loginOrEmail}</Text>
                    ) : null}
                </View>

                <View>
                    <Text>Ancien mot de passe</Text>
                    <TextInput
                        placeholder="Entrez votre ancien mot de passe"
                        value={oldPassword}
                        onChangeText={(text) =>
                            setOldPassword(text.replace(/[<>]/g, ""))
                        }
                        secureTextEntry
                    />
                    {errors.oldPassword ? (
                        <Text>{errors.oldPassword}</Text>
                    ) : null}
                </View>
                <View>
                    <Text>Nouveau mot de passe</Text>
                    <TextInput
                        placeholder="Entrez votre nouveau mot de passe"
                        value={newPassword}
                        onChangeText={(text) =>
                            setNewPassword(text.replace(/[<>]/g, ""))
                        }
                        secureTextEntry
                    />
                    {errors.newPassword ? (
                        <Text>{errors.newPassword}</Text>
                    ) : null}
                </View>
                <View>
                    <Text>Confirmer le nouveau mot de passe</Text>
                    <TextInput
                        placeholder="Confirmez votre nouveau mot de passe"
                        value={confirmNewPassword}
                        onChangeText={(text) =>
                            setConfirmNewPassword(text.replace(/[<>]/g, ""))
                        }
                        secureTextEntry
                    />
                    {errors.confirmNewPassword ? (
                        <Text>{errors.confirmNewPassword}</Text>
                    ) : null}
                </View>

                <TouchableOpacity
                    onPress={handleChangePassword}
                    disabled={isLoading}
                >
                    <Text>
                        {isLoading
                            ? "Chargement..."
                            : "Changer de mot de passe"}
                    </Text>
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

export default ChangePasswordScreen;
