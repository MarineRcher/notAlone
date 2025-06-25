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
import { useContext } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext, User } from "../../context/AuthContext";
import styles from "../form.style";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import BackButton from "../../components/backNavigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any, any>;
const AskNotificationsScreen = ({ navigation }: Props) => {
    const [loading, setLoading] = useState(false);
    const { setUser } = useContext(AuthContext);

    const handleActivateNotifications = async () => {
        setLoading(true);
        try {
            const response = await userService.activateNotifications();
            if (response.token) {
                const decoded = jwtDecode<User>(response.token);
                setUser(decoded);
            }
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
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <BackButton />

            <View>
                <Mascot
                    mascot="hey"
                    text="Tu veux que je t’envoie un petit coucou de temps en temps pour te soutenir ?"
                />
                <View style={styles.buttonRow}>
                    <Button
                        title="Non"
                        onPress={() => navigation.navigate("Main")}
                    />
                    <Button title="Oui" onPress={handleActivateNotifications} />
                </View>
            </View>
        </ScrollView>
    );
};

export default AskNotificationsScreen;
