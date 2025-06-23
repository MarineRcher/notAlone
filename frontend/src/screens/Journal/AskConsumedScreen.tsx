import { Text, View } from "react-native";
import { useState, useEffect } from "react";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import BackButton from "../../components/backNavigation";
import journalService from "../../api/journalService";

const AskConsumedScreen = ({ navigation, route }) => {
    const [journalData, setJournalData] = useState(null);
    const [consumed, setConsumed] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const params = route.params;
        if (params) {
            setJournalData(params);
            if (params.existingData?.journal?.consumed) {
                setConsumed(params.existingData.journal.consumed);
            }
        }
    }, [route.params]);

    const handleNext = async () => {
        setIsLoading(true);
        try {
            if (consumed && journalData?.journalId) {
                await journalService.addUserConsumed({
                    id_journal: journalData.journalId,
                    consumed: consumed,
                });
            }

            const updatedData = {
                ...journalData,
                currentStep: "activities",
            };

            navigation.navigate("Activities", updatedData);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de l'écart:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        const updatedData = {
            ...journalData,
            currentStep: "activities",
        };
        navigation.navigate("AskActivities", updatedData);
    };

    return (
        <View>
            <BackButton />
            <Mascot
                mascot="hey"
                text="Il y a eu un petit écart ? Ce n'est pas grave, je suis toujours là."
            />

            <TextInput
                value={consumed}
                onChangeText={setConsumed}
                placeholder="Décris ton écart..."
                multiline
            />

            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                }}
            >
                <Button title="Passer" onPress={handleSkip} />
                <Button
                    title={isLoading ? "Enregistrement..." : "Suivant"}
                    onPress={handleNext}
                    disabled={isLoading}
                />
            </View>
        </View>
    );
};

export default AskConsumedScreen;
