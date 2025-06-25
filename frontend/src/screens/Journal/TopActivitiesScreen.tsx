import {
	View,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
} from "react-native";
import { useContext, useEffect, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import journalService from "../../api/journalService";
import { NavigationParams, Activity } from "../../types/journal";
import BackButton from "../../components/backNavigation";
import { AuthContext } from "../../context/AuthContext";
import colors from "../../css/colors";
import styles from "./Journal.style";

type Props = NativeStackScreenProps<any, "Activities">;

const TopActivitiesScreen = ({ navigation, route }: Props) =>
{
	const { user } = useContext(AuthContext);
	const [activities, setActivities] = useState<Activity[]>([]);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [journalData, setJournalData] = useState<NavigationParams | null>(
		null
	);
	const [showPopup, setShowPopup] = useState(false);
	const [popupData, setPopupData] = useState({
		message: "",
		totalPoints: 0,
	});

	if (showPopup)
	{
		Alert.alert(
			"Points ajoutés 🎉",
			`${popupData.message}\nPoints totaux: ${popupData.totalPoints}`,
			[{ text: "OK", onPress: () => setShowPopup(false) }]
		);
	}
	useEffect(() =>
	{
		const params = route.params as NavigationParams;

		if (params)
		{
			setJournalData(params);

			if (
				selectedIds.length === 0
                && params.existingData?.activities
                && params.existingData.activities.length > 0
			)
			{
				const existingActivityIds = [
					...new Set(
						params.existingData.activities.map(
							(activityGroup: any) =>
								activityGroup.user_activity.id_activity
						)
					),
				];

				setSelectedIds(existingActivityIds);
			}
		}

		const fetchActivities = async () =>
		{
			try
			{
				const response = await journalService.getActivities();

				setActivities(response.data.activities);
			}
			catch (err)
			{
				console.error("Erreur lors du chargement des activités:", err);
			}
		};

		fetchActivities();
	}, [route.params]);

	const toggleSelection = (id: number) =>
	{
		setSelectedIds((prev) =>
		{
			if (prev.includes(id))
			{
				return prev.filter((i) => i !== id);
			}
			if (prev.length >= 2)
			{
				return prev;
			}
			return [...prev, id];
		});
	};

	const handleNext = async () =>
	{
		if (!journalData?.journalId || selectedIds.length === 0)
		{
			return;
		}

		setIsLoading(true);
		try
		{
			await journalService.addActivities({
				id_journal: journalData.journalId,
				activities: selectedIds,
			});

			if (user?.hasPremium)
			{
				const updatedData: NavigationParams = {
					...journalData,
					currentStep: "goal",
				};

				navigation.navigate("Goal", updatedData);
			}
			else
			{
				const response = await journalService.addPoints({
					id_journal: journalData.journalId,
				});
				const { message, totalPoints } = response.data;

				setPopupData({ message, totalPoints });
				setShowPopup(true);

				navigation.navigate("Main", { screen: "Follow" });
			}
		}
		catch (error)
		{
			console.error(
				"Erreur lors de l'enregistrement des activités:",
				error
			);
		}
		finally
		{
			setIsLoading(false);
		}
	};

	return (
		<View style={styles.page}>
			<BackButton />
			<Mascot
				mascot="hey"
				text="Si tu devais choisir les deux moments clés de ta journée, ce serait quoi ?"
			/>

			{activities.length === 0 ? (
				<ActivityIndicator size="large" color="#00adf5" />
			) : (
				<View style={styles.wordsList}>
					{activities.map((activity) => (
						<TouchableOpacity
							key={activity.id_activity}
							onPress={() =>
								toggleSelection(activity.id_activity)
							}
							style={{
								padding: 24,
								margin: 8,
								borderRadius: 9999,
								backgroundColor: selectedIds.includes(
									activity.id_activity
								)
									? colors.primary
									: colors.secondaryBackeground,
							}}
						>
							<Text style={styles.textWords}>
								{activity.activity}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			)}

			<Button
				title={isLoading ? "Enregistrement..." : "Suivant"}
				onPress={handleNext}
				disabled={isLoading}
			/>
		</View>
	);
};

export default TopActivitiesScreen;
