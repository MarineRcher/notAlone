import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import userService from "../../api/userService";
import validator from "validator";

const ChangeEmailScreen = ({ navigation }) => {
    const [newEmail, setNewEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChangeEmail = async () => {
        if (!newEmail) {
            Alert.alert("Erreur", "Veuillez saisir une adresse e-mail.");
            return;
        }

        if (!validator.isEmail(newEmail)) {
            Alert.alert("Erreur", "Le format de l'e-mail est invalide.");
            return;
        }

        setLoading(true);

        try {
            await userService.changeEmail({ newEmail });
            Alert.alert("Succès", "Votre adresse e-mail a été modifiée.", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error("Erreur changement email :", error);

            let message =
                error?.response?.data?.message || "Une erreur est survenue.";

            Alert.alert("Erreur", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView>
            <View>
                <Text>Changer d'adresse e-mail</Text>

                <TextInput
                    placeholder="Nouvel e-mail"
                    value={newEmail}
                    onChangeText={setNewEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TouchableOpacity
                    onPress={handleChangeEmail}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator /> : <Text>Valider</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default ChangeEmailScreen;
