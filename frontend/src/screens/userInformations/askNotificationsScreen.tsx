import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from "react-native";
import userService from "../../api/userService";

const AskNotificationsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);

    const handleActivateNotifications = async () => {
        setLoading(true);
        try {
            await userService.activateNotifications();
            navigation.navigate("AskNotificationsHour");
        } catch (error) {
            console.error(
                "Erreur lors de l’activation des notifications:",
                error
            );
            Alert.alert("Erreur", "Impossible d'activer les notifications.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView>
            <Text>Souhaitez-vous activer les notifications ?</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Main")}
                    >
                        <Text>Non</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleActivateNotifications}>
                        <Text>Oui</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
};

export default AskNotificationsScreen;
