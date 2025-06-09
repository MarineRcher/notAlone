import React, { useContext, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import { AuthContext, User } from "../../context/AuthContext";
import userService from "../../api/userService";
import { jwtDecode } from "jwt-decode";

const ActivatePremiumScreen = ({ navigation }) => {
    const { setUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    const handleActivate = async () => {
        try {
            setLoading(true);
            const response = await userService.activatePremium();

            if (response.token) {
                const decoded = jwtDecode<User>(response.token);
                setUser(decoded);
            }
            Alert.alert("Succès", "Version premium activée !");
            navigation.goBack();
        } catch (error) {
            console.error("Erreur premium:", error);
            Alert.alert("Erreur", "Impossible d'activer la version premium");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Fonctionnalités Premium</Text>

            <Text style={styles.benefit}>✓ Plus de limites</Text>

            <TouchableOpacity
                onPress={handleActivate}
                disabled={loading}
                style={styles.button}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Activer Premium</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default ActivatePremiumScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    benefit: {
        fontSize: 16,
        marginBottom: 10,
    },
    button: {
        marginTop: 30,
        backgroundColor: "#007AFF",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});
