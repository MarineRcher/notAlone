import React, { useContext, useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    StyleSheet,
    Platform,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { authService } from "../api/authService";
import userService from "../api/userService";
import DateTimePicker from "@react-native-community/datetimepicker";

const UserScreen = ({ navigation }) => {
    const { user, updateNotificationSettings } = useContext(AuthContext);
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
    const handleDeleteUserAccount = async () => {
        try {
            await userService.deleteUserAccount();
            navigation.reset({
                index: 0,
                routes: [{ name: "Register" }],
            });
        } catch (error) {
            Alert.alert("Erreur", "La suppression a échoué");
        }
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

    const handleTimeChange = (event, selectedDate) => {
        if (Platform.OS === "android") setShowPicker(false);
        if (selectedDate) setTime(selectedDate);
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
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifications</Text>

                <TouchableOpacity
                    onPress={toggleNotifications}
                    style={styles.toggleButton}
                >
                    <Text style={styles.toggleText}>
                        {user?.notify ? "Désactiver" : "Activer"} les
                        notifications
                    </Text>
                </TouchableOpacity>

                {user?.notify && (
                    <>
                        {isEditingTime ? (
                            <View style={styles.timePickerContainer}>
                                <TouchableOpacity
                                    onPress={() => setShowPicker(true)}
                                    style={styles.timeButton}
                                >
                                    <Text style={styles.timeText}>
                                        Heure choisie :{" "}
                                        {`${time
                                            .getHours()
                                            .toString()
                                            .padStart(2, "0")}:${time
                                            .getMinutes()
                                            .toString()
                                            .padStart(2, "0")}`}
                                    </Text>
                                </TouchableOpacity>

                                {showPicker && (
                                    <DateTimePicker
                                        value={time}
                                        mode="time"
                                        is24Hour={true}
                                        display="default"
                                        onChange={handleTimeChange}
                                    />
                                )}

                                <TouchableOpacity
                                    onPress={saveNotificationTime}
                                    style={styles.saveButton}
                                >
                                    <Text style={styles.saveButtonText}>
                                        Enregistrer
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => setIsEditingTime(true)}
                                style={styles.timeButton}
                            >
                                <Text style={styles.timeText}>
                                    Heure: {user.hourNotify || "Non définie"}
                                </Text>
                                <Text style={styles.editText}>Modifier</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
            <TouchableOpacity
                onPress={() => navigation.navigate("PrivacyPolicy")}
                style={{ marginVertical: 10 }}
            >
                <Text>Politique de confidentialité</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => navigation.navigate("Support")}
                style={{ marginVertical: 10 }}
            >
                <Text>Contecter le support</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={handleLogout}
                style={{ marginVertical: 10, marginTop: 20 }}
            >
                <Text style={{ color: "red" }}>Se déconnecter</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={handleDeleteUserAccount}
                style={{ marginVertical: 10, marginTop: 20 }}
            >
                <Text style={{ color: "red" }}>Supprimer le compte</Text>
            </TouchableOpacity>
        </View>
    );
};
const styles = StyleSheet.create({
    container: { padding: 20 },
    section: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        paddingTop: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    toggleButton: {
        backgroundColor: "#f0f0f0",
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
    },
    toggleText: {
        textAlign: "center",
        fontWeight: "500",
    },
    timeButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        padding: 12,
        borderRadius: 8,
    },
    timeText: {
        fontWeight: "500",
    },
    editText: {
        color: "#007AFF",
        fontWeight: "500",
    },
    timePickerContainer: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 15,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    saveButton: {
        backgroundColor: "#007AFF",
        padding: 12,
        borderRadius: 8,
        marginTop: 15,
    },
    saveButtonText: {
        color: "white",
        textAlign: "center",
        fontWeight: "bold",
    },
});

export default UserScreen;
