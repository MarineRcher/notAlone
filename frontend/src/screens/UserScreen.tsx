import React, { useContext } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { AuthContext } from "../context/AuthContext";

const UserScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);

    return (
        <View style={{ padding: 20 }}>
            <Text>Profil Utilisateur</Text>

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
        </View>
    );
};

export default UserScreen;
