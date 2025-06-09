import React, { useState, useEffect, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { authService } from "../../api/authService";
import { authHelpers } from "../../api/authHelpers";
import { jwtDecode } from "jwt-decode";
import validator from "validator";
import { AuthContext, User } from "../../context/AuthContext";

const Disable2FAScreen = ({ navigation }) => {
    const [otp, setOtp] = useState("");
    const [userId, setUserId] = useState<number | null>(null);
    const { setUser } = useContext(AuthContext); // ✅ hook bien placé

    useEffect(() => {
        const fetchUserId = async () => {
            const token = await authHelpers.getToken();
            if (!token) {
                Alert.alert("Erreur", "Vous devez être connecté");
                navigation.navigate("Login");
                return;
            }

            const decoded = jwtDecode<User>(token);
            setUser(decoded); // optionnel ici, mais au cas où
            setUserId(decoded.id); // ✅ on stocke l'id
        };

        fetchUserId();
    }, []);

    const handleDisable = async () => {
        if (!validator.isNumeric(otp) || otp.length !== 6) {
            Alert.alert("Erreur", "Le code doit être à 6 chiffres");
            return;
        }

        if (!userId) {
            Alert.alert("Erreur", "Utilisateur non identifié");
            return;
        }

        try {
            const response = await authService.disable2FA({
                userId: userId.toString(),
                otp,
            });

            if (response?.data?.token) {
                await authHelpers.saveToken(response.data.token);
                const decoded = jwtDecode<User>(response.data.token);
                setUser(decoded);
            }

            Alert.alert("Succès", "2FA désactivée");
            navigation.goBack();
        } catch (error) {
            Alert.alert(
                "Erreur",
                error?.response?.data?.message || "Échec de la désactivation"
            );
        }
    };

    return (
        <View>
            <Text>Entrez le code de vérification pour désactiver la 2FA :</Text>
            <TextInput
                placeholder="Code à 6 chiffres"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
            />
            <TouchableOpacity onPress={handleDisable}>
                <Text>Désactiver</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Disable2FAScreen;
