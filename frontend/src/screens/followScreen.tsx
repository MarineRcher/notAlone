import { Text, View } from "react-native";
import { useState } from "react";
import Mascot from "../components/mascot";
import Button from "../components/button";
import { CalendarList } from "react-native-calendars";
import journalService from "../api/journalService";

const FollowScreen = ({ navigation }) => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleDayPress = (day) => {
        setSelectedDate(day.dateString);
    };

    const handleFillJournal = async () => {
        const dateToUse =
            selectedDate || new Date().toISOString().split("T")[0];

        setIsLoading(true);
        try {
            const journalData = await journalService.getJournal({
                date: new Date(dateToUse),
            });

            const navigationParams = {
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
                futureScrollRange={12}
                calendarWidth={320}
                onDayPress={handleDayPress}
                theme={{
                    selectedDayBackgroundColor: "#00adf5",
                    todayTextColor: "#00adf5",
                }}
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
