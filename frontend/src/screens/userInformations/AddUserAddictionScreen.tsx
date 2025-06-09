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

interface Addiction {
    id: number;
    name: string;
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

            Alert.alert("Succès", "Addiction ajoutée avec succès", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
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
        <ScrollView>
            <Text>Ajouter une addiction</Text>

            {/* Sélecteur d'addiction */}
            <View>
                <Text>Addiction</Text>
                <View>
                    <Picker
                        selectedValue={selectedAddiction}
                        onValueChange={(itemValue) =>
                            setSelectedAddiction(itemValue)
                        }
                    >
                        {addictions.map((addiction) => (
                            <Picker.Item
                                key={addiction.id}
                                label={addiction.addiction}
                                value={addiction.id}
                            />
                        ))}
                    </Picker>
                </View>
            </View>

            {/* Sélecteur de date */}
            <View>
                <Text>Date de début</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <Text>{date.toLocaleDateString("fr-FR")}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                    />
                )}
            </View>

            {/* Utilisations par jour */}
            <View>
                <Text>Utilisations par jour</Text>
                <TextInput
                    placeholder="Ex: 5"
                    keyboardType="numeric"
                    value={usePerDay}
                    onChangeText={setUsePerDay}
                />
            </View>

            {/* Dépenses par jour */}
            <View>
                <Text>Dépenses par jour</Text>
                <TextInput
                    placeholder="Ex: 10.50"
                    keyboardType="numeric"
                    value={spendingPerDay}
                    onChangeText={setSpendingPerDay}
                />
            </View>

            {/* Bouton de soumission */}
            <TouchableOpacity onPress={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text>Ajouter l'addiction</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

export default AddUserAddictionScreen;
