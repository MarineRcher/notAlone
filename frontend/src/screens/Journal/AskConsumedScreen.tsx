import { Text, View, TextInput } from "react-native";
import { useState, useEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import BackButton from "../../components/backNavigation";
import journalService from "../../api/journalService";
import { NavigationParams } from "../../types/journal";
import styles from "../form.style";

type Props = NativeStackScreenProps<any, "Consumed">;

const AskConsumedScreen = ({ navigation, route }: Props) => {
    const [journalData, setJournalData] = useState<NavigationParams | null>(
        null
    );
    const [consumed, setConsumed] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const params = route.params as NavigationParams;
        if (params) {
            setJournalData(params);
            // Présélectionner la valeur existante
            if (typeof params.existingData?.journal?.consumed === "boolean") {
                setConsumed(params.existingData.journal.consumed);
            }
        }
    }, [route.params]);

    const handleYesPress = () => {
        setConsumed(true);
    };

    const handleNoPress = () => {
        setConsumed(false);
    };

    const handleNext = async () => {
        if (consumed === null) return;

        setIsLoading(true);
        try {
            if (journalData?.journalId) {
                await journalService.addUserConsumed({
                    id_journal: journalData.journalId,
                    consumed: true,
                });
            }

            const updatedData: NavigationParams = {
                ...journalData!,
                currentStep: "resume",
            };

            navigation.navigate("Resume", updatedData);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de l'écart:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResume = async () => {
        if (consumed === null) return;

        setIsLoading(true);
        try {
            const updatedData: NavigationParams = {
                ...journalData!,
                currentStep: "resume",
            };

            navigation.navigate("Resume", updatedData);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de l'écart:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View>
            <BackButton />
            <Mascot
                mascot="hey"
                text="Il y a eu un petit écart ? Ce n'est pas grave, je suis toujours là."
            />

            <View style={styles.buttonRow}>
                <Button
                    type="secondary"
                    title="Non"
                    onPress={handleResume}
                    disabled={isLoading}
                    style={{
                        backgroundColor:
                            consumed === false ? "#00adf5" : undefined,
                        borderColor: consumed === false ? "#00adf5" : undefined,
                    }}
                    textStyle={{
                        color: consumed === false ? "#fff" : undefined,
                    }}
                />
                <Button
                    title="Oui"
                    onPress={handleNext}
                    disabled={isLoading}
                    style={{
                        backgroundColor:
                            consumed === true ? "#00adf5" : "#f0f0f0",
                        borderColor: consumed === true ? "#00adf5" : "#ccc",
                    }}
                    textStyle={{
                        color: consumed === true ? "#fff" : "#333",
                    }}
                />
            </View>
        </View>
    );
};

export default AskConsumedScreen;
