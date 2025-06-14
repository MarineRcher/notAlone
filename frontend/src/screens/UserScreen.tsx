import React, { useContext, useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    Platform,
    ScrollView,
} from "react-native";
import { AuthContext, User } from "../context/AuthContext";
import { authService } from "../api/authService";
import userService from "../api/userService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { jwtDecode } from "jwt-decode";
import styles from "./useScreen.style";
import Button from "../components/button";
import Link from "../components/linkUserAccount";
import TimePicker from "../components/timePicker";
import LinkPremium from "../components/LinkPremium";

const UserScreen = ({ navigation }) => {
    const { user, updateNotificationSettings } = useContext(AuthContext);
    const { setUser } = useContext(AuthContext);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        if (user?.hourNotify) {
            const [hours, minutes] = user.hourNotify.split(":").map(Number);
            const newDate = new Date();
            newDate.setHours(hours);
            newDate.setMinutes(minutes);
            setTime(newDate);
        }
    }, [user?.hourNotify]);

    const handleLogout = () => {
        Alert.alert("Se déconnecter", "Es-tu sûr de vouloir te déconnecter ?", [
            { text: "Annuler", style: "cancel" },
            {
                text: "Déconnexion",
                style: "destructive",
                onPress: async () => {
                    try {
                        await authService.logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: "Login" }],
                        });
                    } catch (error) {
                        Alert.alert("Erreur", "La déconnexion a échoué");
                    }
                },
            },
        ]);
    };

    const handleDeactivatePremium = async () => {
        try {
            const response = await userService.deactivatePremium();

            if (response.token) {
                const decoded = jwtDecode<User>(response.token);
                setUser(decoded);
            }
            Alert.alert("Succès", "Version premium desactive");
        } catch (error) {
            Alert.alert(
                "Erreur",
                "La deactivation de la version premium a échoué"
            );
        }
    };
    const handleDeleteUserAccount = () => {
        Alert.alert(
            "Supprimer le compte",
            "Cette action est irréversible. Es-tu sûr de vouloir supprimer ton compte ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await userService.deleteUserAccount();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: "Register" }],
                            });
                        } catch (error) {
                            Alert.alert("Erreur", "La suppression a échoué");
                        }
                    },
                },
            ]
        );
    };

    const toggleNotifications = async () => {
        try {
            if (user?.notify) {
                await userService.deactivateNotifications();
                updateNotificationSettings(false);
            } else {
                await userService.activateNotifications();
                updateNotificationSettings(true);
            }
        } catch (error) {
            Alert.alert("Erreur", "Opération échouée");
        }
    };

    const saveNotificationTime = async () => {
        try {
            const hours = time.getHours().toString().padStart(2, "0");
            const minutes = time.getMinutes().toString().padStart(2, "0");
            const timeString = `${hours}:${minutes}`;

            await userService.hourNotifications({ hour: timeString });
            updateNotificationSettings(user?.notify || true, timeString);
            setIsEditingTime(false);
            Alert.alert("Succès", "Heure de notification mise à jour");
        } catch (error) {
            Alert.alert("Erreur", "Format d'heure invalide");
        }
    };

    return (
        <ScrollView style={styles.scrollContainer}>
            <View style={styles.container}>
                <View style={styles.links}>
                    <Text style={styles.titleUserScreen}>
                        Compte Utilisateur
                    </Text>
                    {!user?.hasPremium ? (
                        <LinkPremium
                            onPress={() =>
                                navigation.navigate("ActivatePremium")
                            }
                            title="Activer l'abonnement premium"
                        />
                    ) : (
                        <LinkPremium
                            onPress={handleDeactivatePremium}
                            title="Désactiver l'abonnement premium"
                        />
                    )}
                    <Link
                        onPress={() => navigation.navigate("ChangeEmail")}
                        title="Changer d'email"
                    />
                    <Link
                        onPress={() => navigation.navigate("ChangePassword")}
                        title="Changer de mot de passe"
                    />
                    {user?.has2FA ? (
                        <Link
                            onPress={() => navigation.navigate("Disable2FA")}
                            title="Désactiver la 2FA"
                        />
                    ) : (
                        <Link
                            onPress={() => navigation.navigate("Enable2FA")}
                            title="Activer la 2FA"
                        />
                    )}
                    {user?.notify && (
                        <Text style={styles.sectionTitle}>Notifications</Text>
                    )}
                    <Link
                        onPress={toggleNotifications}
                        title={
                            (user?.notify ? "Désactiver" : "Activer") +
                            " les notifications"
                        }
                    />

                    {user?.notify && (
                        <>
                            {isEditingTime ? (
                                <View>
                                    <Text style={styles.bold}>
                                        Heure choisie :
                                    </Text>

                                    <TimePicker
                                        value={time}
                                        onChange={(newTime) => setTime(newTime)}
                                        showPicker={showPicker}
                                        setShowPicker={setShowPicker}
                                    />
                                    <Button
                                        title="Enregistrer"
                                        onPress={saveNotificationTime}
                                    />
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.timeButton}
                                    onPress={() => setIsEditingTime(true)}
                                >
                                    <Text style={styles.bold}>
                                        Heure:{" "}
                                        {user.hourNotify || "Non définie"}
                                    </Text>
                                    <Text style={styles.link}>Modifier</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                    <Link
                        onPress={() => navigation.navigate("PrivacyPolicy")}
                        title="Politique de confidentialité"
                    />
                    <Link
                        onPress={() => navigation.navigate("Support")}
                        title="Contacter le support"
                    />
                </View>
                <View style={styles.footer}>
                    <Button onPress={handleLogout} title="Se déconnecter" />
                    <TouchableOpacity onPress={handleDeleteUserAccount}>
                        <Text style={styles.link}>Supprimer le compte</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

export default UserScreen;
