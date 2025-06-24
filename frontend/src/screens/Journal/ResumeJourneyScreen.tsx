import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import journalService from "../../api/journalService";
import { NavigationParams, ResumeJourneyWord } from "../../types/journal";
import BackButton from "../../components/backNavigation";

type Props = NativeStackScreenProps<any, "Resume">;

const ResumeJourneyScreen = ({ navigation, route }: Props) => {
    const [words, setWords] = useState<ResumeJourneyWord[]>([]);
    const [selectedWord, setSelectedWord] = useState<ResumeJourneyWord | null>(
        null
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
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
                            params.existingData.resume_journey.id_resume_journey
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
        if (!selectedWord || !journalData) return;
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
                    ...journalData.existingData?.journal,
                    resume: selectedWord.resume_journey,
                },
            },
        };

        navigation.navigate("Activities", updatedData);
    };

    return (
        <View>
            <BackButton />
            <Mascot
                mascot="hey"
                text="Si ta journée était un mot, ce serait… ? J'ai hâte de le découvrir."
            />

            {words.length === 0 ? (
                <ActivityIndicator size="large" color="#00adf5" />
            ) : (
                <View
                    style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        marginVertical: 20,
                    }}
                >
                    {words.map((word) => (
                        <TouchableOpacity
                            key={word.id_resume_journey}
                            onPress={() => setSelectedWord(word)}
                            style={{
                                padding: 16,
                                margin: 8,
                                borderRadius: 999,
                                borderWidth: 1,
                                borderColor:
                                    selectedWord?.id_resume_journey ===
                                    word.id_resume_journey
                                        ? "#00adf5"
                                        : "#ccc",
                                backgroundColor:
                                    selectedWord?.id_resume_journey ===
                                    word.id_resume_journey
                                        ? "#00adf5"
                                        : "#fff",
                            }}
                        >
                            <Text
                                style={{
                                    color:
                                        selectedWord?.id_resume_journey ===
                                        word.id_resume_journey
                                            ? "#fff"
                                            : "#333",
                                    fontWeight: "600",
                                }}
                            >
                                {word.resume_journey}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Button title="Suivant" onPress={handleNext} />
        </View>
    );
};

export default ResumeJourneyScreen;
