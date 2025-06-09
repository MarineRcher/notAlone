import React, { useState, useEffect, useContext } from "react";
import {
    View,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    Alert,
} from "react-native";
import { authService } from "../../api/authService";
import * as Clipboard from "expo-clipboard";
import validator from "validator";
import { authHelpers } from "../../api/authHelpers";
import { jwtDecode } from "jwt-decode";
import { AuthContext, User } from "../../context/AuthContext";

const Enable2FAScreen = ({ navigation, route }) => {
    const isFromRegistration = route?.params?.isFromRegistration || false;

    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [otp, setOtp] = useState("");
    const [tempToken, setTempToken] = useState("");
    const [secretKey, setSecretKey] = useState("");

    const { setUser } = useContext(AuthContext); // ✅ hook bien positionné

    const generate2FASecret = async () => {
        try {
            const response = await authService.generate2FASecret();
            setQrCodeUrl(response.data.qrCodeUrl);
            setTempToken(response.data.tempToken);
            setSecretKey(response.data.secret);
        } catch (error) {
            Alert.alert("Erreur", "Échec de la génération du secret 2FA");
        }
    };

    const verifySetup = async () => {
        try {
            if (!validator.isNumeric(otp) || otp.length !== 6) {
                Alert.alert("Erreur", "Le code doit être à 6 chiffres");
                return;
            }

            const response = await authService.verify2FASetup({
                token: tempToken,
                otp,
            });

            if (response.data.token) {
                await authHelpers.saveToken(response.data.token);
                const decoded = jwtDecode<User>(response.data.token);
                setUser(decoded);
            }

            if (isFromRegistration) {
                navigation.navigate("AddUserAddiction");
            } else {
                navigation.navigate("Main");
            }
        } catch (error) {
            Alert.alert("Erreur", "Code invalide ou expiré");
        }
    };

    useEffect(() => {
        generate2FASecret();
    }, []);

    return (
        <View>
            <Text>Scannez ce QR Code avec Google Authenticator :</Text>
            {qrCodeUrl && (
                <Image
                    source={{ uri: qrCodeUrl }}
                    style={{ width: 200, height: 200 }}
                />
            )}
            <TouchableOpacity
                onPress={async () => {
                    await Clipboard.setStringAsync(secretKey);
                    Alert.alert("Succès", "Clé copiée !");
                }}
                style={{
                    padding: 10,
                }}
            >
                <Text>Copier la clé. Ne partagez jamais cette clé</Text>
            </TouchableOpacity>

            <TextInput
                style={{
                    margin: 10, // 🛠 typo corrigée: "margi" → "margin"
                }}
                placeholder="Entrez le code de vérification"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
            />

            <TouchableOpacity onPress={verifySetup}>
                <Text>Vérifier</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Enable2FAScreen;
