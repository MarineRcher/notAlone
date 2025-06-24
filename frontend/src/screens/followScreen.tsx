import { View } from "react-native";
import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Mascot from "../components/mascot";
import Button from "../components/button";
import { CalendarList } from "react-native-calendars";
import journalService from "../api/journalService";
import { NavigationParams, JournalResponse } from "../types/journal";

type Props = NativeStackScreenProps<any, "Follow">;

const FollowScreen = ({ navigation }: Props) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleDayPress = (day: { dateString: string }) => {
        setSelectedDate(day.dateString);
    };

    const handleFillJournal = async () => {
        const dateToUse =
            selectedDate || new Date().toISOString().split("T")[0];

        setIsLoading(true);
        try {
            const journalData: JournalResponse =
                await journalService.getJournal({
                    date: new Date(dateToUse),
                });

            const navigationParams: NavigationParams = {
                date: dateToUse,
                journalId: journalData?.data?.journal?.id_journal,
                existingData: journalData?.data || null,
                isNewJournal: !journalData?.data?.journal,
                currentStep: "difficulty",
            };

            navigation.navigate("Difficulty", navigationParams);
        } catch (error) {
            navigation.navigate("Difficulty", {
                date: dateToUse,
                isNewJournal: true,
                currentStep: "difficulty",
            });
        } finally {
            setIsLoading(false);
        }
    };
    const today = new Date().toISOString().split("T")[0];

    return (
        <View>
            <Mascot
                mascot="hey"
                text="Ton journal t'attend ! Quelques lignes et hop, des points pour nourrir ta forêt."
            />
            <CalendarList
                horizontal
                pagingEnabled
                pastScrollRange={12}
                futureScrollRange={0}
                calendarWidth={320}
                maxDate={today}
                onDayPress={handleDayPress}
                theme={{
                    selectedDayBackgroundColor: "#00adf5",
                    todayTextColor: "#00adf5",
                }}
                markedDates={
                    selectedDate
                        ? {
                              [selectedDate]: {
                                  selected: true,
                                  selectedColor: "#00adf5",
                              },
                          }
                        : {}
                }
            />
            <Button
                title={isLoading ? "Chargement..." : "Remplir le journal"}
                onPress={handleFillJournal}
                disabled={isLoading}
            />
        </View>
    );
};

export default FollowScreen;
