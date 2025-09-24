import { View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Mascot from "../components/mascot";
import Button from "../components/button";
import { Calendar, CalendarList } from "react-native-calendars";
import journalService from "../api/journalService";
import { NavigationParams, JournalResponse } from "../types/journal";
import colors from "../css/colors";
import { Fonts } from "../css/font";
import styles from "./followScreen.style";
import { ScrollView } from "react-native-gesture-handler";

type Props = NativeStackScreenProps<any, "Follow">;

const FollowScreen = ({ navigation }: Props) => {
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const handleDayPress = (day: { dateString: string }) => {
		setSelectedDate(day.dateString);
	};

	const handleFillJournal = async () => {
		const dateToUse = selectedDate || new Date().toISOString().split("T")[0];

		setIsLoading(true);
		try {
			const journalData: JournalResponse = await journalService.getJournal({
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
		<ScrollView>
			<View style={styles.FollowPage}>
				<Mascot
					mascot="hey"
					text="Ton journal t'attend ! Quelques lignes et hop, des points pour nourrir ta forêt."
				/>
				<View style={styles.containerCalendar}>
					<CalendarList
						style={styles.calendar}
						horizontal
						pagingEnabled
						pastScrollRange={12}
						futureScrollRange={0}
						calendarWidth={300}
						maxDate={today}
						onDayPress={handleDayPress}
						theme={{
							selectedDayBackgroundColor: colors.primary,
							todayTextColor: colors.primary,
							calendarBackground: colors.background,
							textMonthFontFamily: Fonts.quicksand.regular,
							textDayHeaderFontFamily: Fonts.quicksand.regular,
							dayTextColor: colors.text,
						}}
						markedDates={
							selectedDate
								? {
										[selectedDate]: {
											selected: true,
											selectedColor: colors.primary,
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
				<View style={styles.stats}>
					<Text style={styles.title}>Statistiques</Text>
					<TouchableOpacity onPress={() => navigation.navigate("Acquired")}>
						<View style={styles.boxAcquired}>
							<Text style={styles.lightTitle}>Acquis / Pas acquis</Text>
						</View>
					</TouchableOpacity>
				</View>
			</View>
		</ScrollView>
	);
};

export default FollowScreen;
