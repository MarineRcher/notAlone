import { Text, View } from "react-native";
import { useState, useEffect } from "react";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import BackButton from "../../components/backNavigation";
import journalService from "../../api/journalService";

const AskDifficultyScreen = ({ navigation, route }) => {
    const [journalData, setJournalData] = useState(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const params = route.params;
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

            // Mettre à jour les données pour les écrans suivants
            const updatedData = {
                ...journalData,
                journalId:
                    response.data?.data?.id_journal || journalData?.journalId,
                isNewJournal: false,
                currentStep: "consumed",
            };

            navigation.navigate("AskConsumed", updatedData);
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

            {/* Boutons de sélection de difficulté */}
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
