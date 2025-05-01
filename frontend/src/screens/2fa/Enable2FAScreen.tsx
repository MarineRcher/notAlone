import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    Alert,
} from "react-native";
import authService from "../../api/authService";
import * as Clipboard from "expo-clipboard";

const Enable2FAScreen = ({ navigation }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [otp, setOtp] = useState("");
    const [tempToken, setTempToken] = useState("");
    const [secretKey, setSecretKey] = useState("");

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
            await authService.verify2FASetup({ token: tempToken, otp });
            Alert.alert("Succès", "2FA activé avec succès !");
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
