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
import validator from "validator";

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

        // Validation du login ou email
        if (!loginOrEmail.trim()) {
            newErrors.loginOrEmail = "Le login ou l'email est requis";
            isValid = false;
        } else if (loginOrEmail.includes("@")) {
            // Validation d'email avec validator
            if (!validator.isEmail(loginOrEmail)) {
                newErrors.loginOrEmail = "Format d'email invalide";
                isValid = false;
            }
        } else {
            // Validation du login avec validator
            if (!validator.matches(loginOrEmail, /^[a-zA-Z0-9_-]{3,20}$/)) {
                newErrors.loginOrEmail =
                    "Login invalide (caractères autorisés: a-z, 0-9, -, _)";
                isValid = false;
            }
        }

        // Validation de l'ancien mot de passe
        if (!oldPassword) {
            newErrors.oldPassword = "L'ancien mot de passe est requis";
            isValid = false;
        }

        // Validation du nouveau mot de passe
        if (!newPassword) {
            newErrors.newPassword = "Le nouveau mot de passe est requis";
            isValid = false;
        } else if (
            !validator.isStrongPassword(newPassword, {
                minLength: 12,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })
        ) {
            newErrors.newPassword =
                "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial";
            isValid = false;
        }

        // Confirmation du nouveau mot de passe
        if (newPassword !== confirmNewPassword) {
            newErrors.confirmNewPassword =
                "Les mots de passe ne correspondent pas";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleLoginOrEmailChange = (text: string) => {
        setLoginOrEmail(text);
    };

    const handleOldPasswordChange = (text: string) => {
        setOldPassword(text);
    };

    const handleNewPasswordChange = (text: string) => {
        setNewPassword(text);
    };

    const handleConfirmNewPasswordChange = (text: string) => {
        setConfirmNewPassword(text);
    };

    const handleChangePassword = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            let sanitizedLoginOrEmail = loginOrEmail;
            if (loginOrEmail.includes("@")) {
                sanitizedLoginOrEmail =
                    validator.normalizeEmail(loginOrEmail) || loginOrEmail;
            } else {
                sanitizedLoginOrEmail = validator.escape(loginOrEmail.trim());
            }

            await authService.changePassword({
                loginOrEmail: sanitizedLoginOrEmail,
                oldPassword,
                newPassword,
            });

            Alert.alert("Succès", "Changement de mot de passe réussi!");
            navigation.navigate("Login");
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
                        onChangeText={handleLoginOrEmailChange}
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
                        onChangeText={handleOldPasswordChange}
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
                        onChangeText={handleNewPasswordChange}
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
                        onChangeText={handleConfirmNewPasswordChange}
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
                    <Text>Retour à la connexion</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default ChangePasswordScreen;
