import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import journalService from "../../api/journalService";
import { NavigationParams, Activity } from "../../types/journal";

type Props = NativeStackScreenProps<any, "Activities">;

const TopActivitiesScreen = ({ navigation, route }: Props) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [journalData, setJournalData] = useState<NavigationParams | null>(
        null
    );

    useEffect(() => {
        const params = route.params as NavigationParams;
        if (params) setJournalData(params);

        const fetchActivities = async () => {
            try {
                const response = await journalService.getActivities();
                setActivities(response.data.activities);
            } catch (err) {
                console.error("Erreur lors du chargement des activités:", err);
            }
        };

        fetchActivities();
    }, [route.params]);

    const toggleSelection = (id: number) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) return prev.filter((i) => i !== id);
            if (prev.length >= 2) return prev;
            return [...prev, id];
        });
    };

    const handleNext = async () => {
        if (!journalData?.journalId || selectedIds.length === 0) return;

        setIsLoading(true);
        try {
            await journalService.addActivities({
                id_journal: journalData.journalId,
                activities: selectedIds,
            });

            const updatedData: NavigationParams = {
                ...journalData,
                currentStep: "goal",
            };

            navigation.navigate("Goal", updatedData);
        } catch (error) {
            console.error(
                "Erreur lors de l'enregistrement des activités:",
                error
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View>
            <Mascot
                mascot="hey"
                text="Si tu devais choisir les deux moments clés de ta journée, ce serait quoi ?"
            />

            {activities.length === 0 ? (
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
                    {activities.map((activity) => (
                        <TouchableOpacity
                            key={activity.id_activity}
                            onPress={() =>
                                toggleSelection(activity.id_activity)
                            }
                            style={{
                                padding: 14,
                                margin: 8,
                                borderRadius: 999,
                                borderWidth: 1,
                                borderColor: selectedIds.includes(
                                    activity.id_activity
                                )
                                    ? "#00adf5"
                                    : "#ccc",
                                backgroundColor: selectedIds.includes(
                                    activity.id_activity
                                )
                                    ? "#00adf5"
                                    : "#fff",
                            }}
                        >
                            <Text
                                style={{
                                    color: selectedIds.includes(
                                        activity.id_activity
                                    )
                                        ? "#fff"
                                        : "#333",
                                    fontWeight: "600",
                                }}
                            >
                                {activity.activity}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Button
                title={isLoading ? "Enregistrement..." : "Suivant"}
                onPress={handleNext}
                disabled={selectedIds.length === 0 || isLoading}
            />
        </View>
    );
};

export default TopActivitiesScreen;
