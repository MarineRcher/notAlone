import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { authService } from "../../api/authService";
import validator from "validator";
import { authHelpers } from "../../api/authHelpers";

const TwoFactorLoginScreen = ({ route, navigation }) => {
    const [otp, setOtp] = useState("");
    const { tempToken } = route.params;

    const handleVerify = async () => {
        try {
            if (!validator.isNumeric(otp) || otp.length !== 6) {
                Alert.alert("Erreur", "Le code doit être à 6 chiffres");
                return;
            }
            const response = await authService.verify2FALogin({
                tempToken,
                otp,
            });
            await authHelpers.saveToken(response.data.token);
            Alert.alert("Succès", "Connexion réussie !");
            navigation.navigate("Login");
        } catch (error) {
            Alert.alert(
                "Erreur",
                error.response?.data?.message || "Code invalide"
            );
        }
    };

    return (
        <View>
            <Text>Entrez le code de vérification 2FA :</Text>
            <TextInput
                placeholder="Code à 6 chiffres"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
            />
            <TouchableOpacity onPress={handleVerify}>
                <Text>Vérifier</Text>
            </TouchableOpacity>
        </View>
    );
};

export default TwoFactorLoginScreen;
