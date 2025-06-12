import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import addictionService from "../../api/addictionService";
import Mascot from "../../components/mascot";
import styles from "../form.style";
import BackButton from "../../components/backNavigation";
import Input from "../../components/input";
import Button from "../../components/button";
import DatePicker from "../../components/datePicker";

interface Addiction {
    id: number;
    addiction: string;
}

const AddUserAddictionScreen = ({ navigation }) => {
    const [addictions, setAddictions] = useState<Addiction[]>([]);
    const [selectedAddiction, setSelectedAddiction] = useState<number | null>(
        null
    );
    const [date, setDate] = useState(new Date());
    const [usePerDay, setUsePerDay] = useState("");
    const [spendingPerDay, setSpendingPerDay] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchAddictions = async () => {
            try {
                const data = await addictionService.getAllAddictions();
                setAddictions(data.addictions);
                if (data.length > 0) setSelectedAddiction(data[0].id);
            } catch (error) {
                Alert.alert("Erreur", error.message);
            } finally {
                setFetching(false);
            }
        };

        fetchAddictions();
    }, []);

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const validateForm = () => {
        if (!selectedAddiction) {
            Alert.alert("Erreur", "Veuillez sélectionner une addiction");
            return false;
        }

        if (usePerDay && isNaN(parseFloat(usePerDay))) {
            Alert.alert(
                "Erreur",
                "Le nombre d'utilisations doit être un nombre valide"
            );
            return false;
        }

        if (spendingPerDay && isNaN(parseFloat(spendingPerDay))) {
            Alert.alert(
                "Erreur",
                "Le montant dépensé doit être un nombre valide"
            );
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await addictionService.addUserAddiction({
                addiction_id: selectedAddiction!,
                date: date.toISOString(),
                use_a_day: usePerDay ? parseFloat(usePerDay) : undefined,
                spending_a_day: spendingPerDay
                    ? parseFloat(spendingPerDay)
                    : undefined,
            });

            navigation.navigate("AskNotifications");
        } catch (error) {
            Alert.alert("Erreur", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (fetching) {
        return (
            <View>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <BackButton />
            <View style={styles.container}>
                <Mascot mascot="hey" text="Parle-moi un peu de toi..." />

                <View style={styles.formSection}>
                    <Picker
                        selectedValue={selectedAddiction}
                        onValueChange={(itemValue) =>
                            setSelectedAddiction(itemValue)
                        }
                    >
                        <Picker.Item
                            style={styles.pickerItem}
                            label="Sélectionnez une addiction"
                            value={null}
                            enabled={false}
                        />
                        {addictions.map((addiction) => (
                            <Picker.Item
                                style={styles.pickerItem}
                                key={addiction.id}
                                label={addiction.addiction}
                                value={addiction.id}
                            />
                        ))}
                    </Picker>

                    <DatePicker
                        value={date}
                        onChange={setDate}
                        placeholder="Sélectionnez une date"
                        showPicker={showDatePicker}
                        setShowPicker={setShowDatePicker}
                    />
                    <Input
                        placeholder="Consommation par jour"
                        keyboardType="numeric"
                        value={usePerDay}
                        onChangeText={setUsePerDay}
                    />
                    <Input
                        placeholder="Dépenses par jour"
                        keyboardType="numeric"
                        value={spendingPerDay}
                        onChangeText={setSpendingPerDay}
                    />
                </View>

                <Button
                    title={isLoading ? "Chargement..." : "Ajouter l'addiction"}
                    disabled={isLoading ? true : false}
                    onPress={handleSubmit}
                />
            </View>
        </ScrollView>
    );
};

export default AddUserAddictionScreen;
