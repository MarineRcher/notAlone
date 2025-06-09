import React, { useContext } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { authService } from "../api/authService";

const UserScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const handleLogout = async () => {
        try {
            await authService.logout();
            navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
            });
        } catch (error) {
            Alert.alert("Erreur", "La déconnexion a échoué");
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Text>Profil Utilisateur</Text>
            <TouchableOpacity
                onPress={() => navigation.navigate("ChangeEmail")}
                style={{ marginVertical: 10 }}
            >
                <Text>Changer d'email</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => navigation.navigate("ChangePassword")}
                style={{ marginVertical: 10 }}
            >
                <Text>Changer de mot de passe</Text>
            </TouchableOpacity>
            {user?.has2FA ? (
                <TouchableOpacity
                    onPress={() => navigation.navigate("Disable2FA")}
                    style={{ marginVertical: 10 }}
                >
                    <Text>Désactiver la 2FA</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={() => navigation.navigate("Enable2FA")}
                    style={{ marginVertical: 10 }}
                >
                    <Text>Activer la 2FA</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity
                onPress={handleLogout}
                style={{ marginVertical: 10, marginTop: 20 }}
            >
                <Text style={{ color: "red" }}>Se déconnecter</Text>
            </TouchableOpacity>
        </View>
    );
};

export default UserScreen;
