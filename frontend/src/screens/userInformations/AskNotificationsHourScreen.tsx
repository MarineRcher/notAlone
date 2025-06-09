import React, { useState } from "react";
import {
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    View,
    Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import userService from "../../api/userService";

const AskNotificationsHourScreen = ({ navigation }) => {
    const [hour, setHour] = useState(""); // Format HH:MM
    const [showPicker, setShowPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date());

    const formatToHHMM = (dateObj: Date): string => {
        const h = dateObj.getHours().toString().padStart(2, "0");
        const m = dateObj.getMinutes().toString().padStart(2, "0");
        return `${h}:${m}`;
    };

    const onChangeTime = (event, selectedDate) => {
        if (Platform.OS === "android") {
            setShowPicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
            const formatted = formatToHHMM(selectedDate);
            setHour(formatted);
        }
    };

    const handleSubmit = async () => {
        if (!hour) {
            Alert.alert("Erreur", "Veuillez sélectionner une heure.");
            return;
        }

        setLoading(true);
        try {
            await userService.hourNotifications({ hour });
            Alert.alert("Succès", `Heure définie à ${hour}`, [
                { text: "OK", onPress: () => navigation.navigate("Main") },
            ]);
        } catch (error) {
            console.error("Erreur heure notifications :", error);
            Alert.alert("Erreur", "Impossible de définir l'heure.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={{ fontSize: 18, marginBottom: 20 }}>
                À quelle heure voulez-vous recevoir les notifications ?
            </Text>

            <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={{ marginBottom: 20 }}
            >
                <Text style={{ fontSize: 16 }}>
                    {hour ? `Heure choisie : ${hour}` : "Choisir une heure"}
                </Text>
            </TouchableOpacity>

            {showPicker && (
                <DateTimePicker
                    value={date}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={onChangeTime}
                />
            )}

            <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={{ backgroundColor: "#4CAF50", padding: 10 }}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        Valider
                    </Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

export default AskNotificationsHourScreen;
