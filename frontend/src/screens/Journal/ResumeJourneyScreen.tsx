import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import journalService from "../../api/journalService";
import { NavigationParams, ResumeJourneyWord } from "../../types/journal";
import BackButton from "../../components/backNavigation";
import colors from "../../css/colors";
import { Fonts } from "../../css/font";
import styles from "./Journal.style";

type Props = NativeStackScreenProps<any, "Resume">;

const ResumeJourneyScreen = ({ navigation, route }: Props) => {
    const [words, setWords] = useState<ResumeJourneyWord[]>([]);
    const [selectedWord, setSelectedWord] = useState<ResumeJourneyWord | null>(
        null
    );
    const [journalData, setJournalData] = useState<NavigationParams | null>(
        null
    );

    useEffect(() => {
        const params = route.params as NavigationParams;
        if (params) {
            setJournalData(params);
        }

        const fetchWords = async () => {
            try {
                const response = await journalService.getResumeJourney();
                setWords(response.data.resumeJourney);

                if (
                    params?.existingData?.resume_journey &&
                    response.data.resumeJourney
                ) {
                    const existingWord = response.data.resumeJourney.find(
                        (word: ResumeJourneyWord) =>
                            word.id_resume_journey ===
                            params.existingData?.resume_journey
                                ?.id_resume_journey
                    );
                    if (existingWord) {
                        setSelectedWord(existingWord);
                    }
                }
            } catch (err) {
                console.error("Erreur lors de la récupération des mots:", err);
            }
        };

        fetchWords();
    }, [route.params]);

    const handleNext = async () => {
        if (!selectedWord || !journalData || !journalData.journalId) {
            console.error("Missing required data for journal update");
            return;
        }

        try {
            await journalService.addResumeJourney({
                id_journal: journalData.journalId,
                id_resume_journey: selectedWord.id_resume_journey,
            });

            const updatedData: NavigationParams = {
                ...journalData,
                currentStep: "activities",
                existingData: {
                    ...journalData.existingData,
                    journal: {
                        id_journal: journalData.journalId,
                        ...journalData.existingData?.journal,
                        resume: selectedWord.resume_journey,
                    },
                },
            };

            navigation.navigate("Activities", updatedData);
        } catch (error) {
            console.error("Error updating journal:", error);
        }
    };

    return (
        <View style={styles.page}>
            <BackButton />
            <Mascot
                mascot="hey"
                text="Si ta journée était un mot, ce serait… ? J'ai hâte de le découvrir."
            />

            {words.length === 0 ? (
                <ActivityIndicator size="large" color="#00adf5" />
            ) : (
                <View style={styles.wordsList}>
                    {words.map((word) => (
                        <TouchableOpacity
                            key={word.id_resume_journey}
                            onPress={() => setSelectedWord(word)}
                            style={{
                                padding: 24,
                                margin: 8,
                                borderRadius: 9999,
                                backgroundColor:
                                    selectedWord?.id_resume_journey ===
                                    word.id_resume_journey
                                        ? colors.primary
                                        : colors.secondaryBackeground,
                            }}
                        >
                            <Text style={styles.textWords}>
                                {word.resume_journey}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Button
                title="Suivant"
                onPress={handleNext}
                disabled={!selectedWord || !journalData?.journalId}
            />
        </View>
    );
};

export default ResumeJourneyScreen;
