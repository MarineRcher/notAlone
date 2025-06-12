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
import { useContext } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext, User } from "../../context/AuthContext";
import styles from "../form.style";
import BackButton from "../../components/backNavigation";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import TimePicker from "../../components/timePicker";

const AskNotificationsHourScreen = ({ navigation }) => {
    const { setUser } = useContext(AuthContext);
    const [hour, setHour] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date());

    const formatToHHMM = (dateObj: Date): string => {
        const h = dateObj.getHours().toString().padStart(2, "0");
        const m = dateObj.getMinutes().toString().padStart(2, "0");
        return `${h}:${m}`;
    };

    const handleSubmit = async () => {
        if (!hour) {
            Alert.alert("Erreur", "Veuillez sélectionner une heure.");
            return;
        }

        setLoading(true);
        try {
            const response = await userService.hourNotifications({ hour });
            if (response.token) {
                const decoded = jwtDecode<User>(response.token);
                setUser(decoded);
            }
            navigation.navigate("Main");
        } catch (error) {
            console.error("Erreur heure notifications :", error);
            Alert.alert("Erreur", "Impossible de définir l'heure.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <BackButton />

                <Mascot
                    mascot="hey"
                    text="Dis-moi, quel est le meilleur moment pour que je vienne te souffler quelques encouragements ?"
                />

                <View style={styles.formSection}>
                    <TimePicker
                        value={date}
                        onChange={(d) => {
                            setDate(d);
                            setHour(formatToHHMM(d));
                        }}
                        showPicker={showPicker}
                        setShowPicker={setShowPicker}
                        placeholder="Heure de notification"
                        error={hour ? "" : "Veuillez choisir une heure"}
                    />
                    <Button
                        title={isLoading ? "Chargement..." : "Valider"}
                        disabled={isLoading ? true : false}
                        onPress={handleSubmit}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

export default AskNotificationsHourScreen;
