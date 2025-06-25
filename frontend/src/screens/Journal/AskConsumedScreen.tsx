import { Text, View, TextInput, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import BackButton from "../../components/backNavigation";
import journalService from "../../api/journalService";
import { NavigationParams } from "../../types/journal";
import styles from "../form.style";
import colors from "../../css/colors";

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

    const handleNext = async () => {
        // ✅ Permettre la navigation même sans sélection (valeur par défaut : true pour "Oui")
        const consumedValue = consumed !== null ? consumed : true;
        
        setIsLoading(true);
        try {
            // ✅ Seulement appeler l'API si on a un journal existant ET consumed = true
            if (journalData?.journalId && consumedValue) {
                await journalService.addUserConsumed({
                    id_journal: journalData.journalId,
                    consumed: consumedValue,
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
        // ✅ Permettre la navigation même sans sélection (valeur par défaut : false pour "Non")
        const consumedValue = consumed !== null ? consumed : false;
        
        setIsLoading(true);
        try {
            // ✅ Pour "Non", on peut aussi enregistrer la valeur si on a un journal
            if (journalData?.journalId) {
                await journalService.addUserConsumed({
                    id_journal: journalData.journalId,
                    consumed: consumedValue,
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

    // ✅ Fonction pour gérer le clic sur les boutons et mettre à jour l'état
    const handleButtonPress = (value: boolean, action: () => void) => {
        setConsumed(value);
        action();
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <BackButton />

            <View>
                <Mascot
                    mascot="hey"
                    text="Il y a eu un petit écart ? Ce n'est pas grave, je suis toujours là."
                />

                <View style={styles.buttonRow}>
                    <Button
                        type="secondary"
                        title="Non"
                        onPress={() => handleButtonPress(false, handleResume)}
                        disabled={isLoading}
                        style={{
                            backgroundColor:
                                consumed === false
                                    ? colors.secondary
                                    : colors.background,
                            borderColor: colors.secondary,
                            borderWidth: consumed === false ? 0 : 1,
                        }}
                        textStyle={{
                            color:
                                consumed === false
                                    ? colors.background
                                    : colors.secondary,
                        }}
                    />
                    <Button
                        title="Oui"
                        onPress={() => handleButtonPress(true, handleNext)}
                        disabled={isLoading}
                        style={{
                            backgroundColor:
                                consumed === true
                                    ? colors.text
                                    : colors.background,
                            borderColor: colors.text,
                            borderWidth: consumed === true ? 0 : 1,
                        }}
                        textStyle={{
                            color:
                                consumed === true
                                    ? colors.background
                                    : colors.text,
                        }}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

export default AskConsumedScreen;