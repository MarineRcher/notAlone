import { View } from "react-native";
import { useState, useEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import BackButton from "../../components/backNavigation";
import journalService from "../../api/journalService";
import { NavigationParams } from "../../types/journal";

type Props = NativeStackScreenProps<any, "Difficulty">;

const AskDifficultyScreen = ({ navigation, route }: Props) => {
    const [journalData, setJournalData] = useState<NavigationParams | null>(
        null
    );
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const params = route.params as NavigationParams;
        if (params) {
            setJournalData(params);
            if (params.existingData?.journal?.difficulty) {
                setSelectedDifficulty(params.existingData.journal.difficulty);
            }
        }
    }, [route.params]);

    const handleNext = async () => {
        if (!selectedDifficulty) return;

        setIsLoading(true);
        try {
            const response = await journalService.addUserDifficulty({
                id_journal: journalData?.journalId,
                date: new Date(journalData?.date),
                difficulty: selectedDifficulty,
            });

            const updatedData: NavigationParams = {
                ...journalData!,
                journalId:
                    response.data?.data?.id_journal || journalData?.journalId,
                isNewJournal: false,
                currentStep: "consumed",
            };

            navigation.navigate("Consumed", updatedData);
        } catch (error) {
            console.error(
                "Erreur lors de l'enregistrement de la difficulté:",
                error
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View>
            <BackButton />
            <Mascot
                mascot="hey"
                text="Un petit coup de museau pour te demander : comment va ton monde intérieur aujourd'hui ?"
            />

            <View>
                {["Facile", "Moyen", "Dur"].map((difficulty) => (
                    <Button
                        key={difficulty}
                        title={difficulty}
                        onPress={() => setSelectedDifficulty(difficulty)}
                        style={{
                            backgroundColor:
                                selectedDifficulty === difficulty
                                    ? "#00adf5"
                                    : "#f0f0f0",
                        }}
                    />
                ))}
            </View>

            <Button
                title={isLoading ? "Enregistrement..." : "Suivant"}
                onPress={handleNext}
                disabled={!selectedDifficulty || isLoading}
            />
        </View>
    );
};

export default AskDifficultyScreen;
