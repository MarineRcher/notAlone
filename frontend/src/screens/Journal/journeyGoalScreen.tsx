import { TextInput, View, Text } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import BackButton from "../../components/backNavigation";
import journalService from "../../api/journalService";
import { NavigationParams } from "../../types/journal";
import { AuthContext } from "../../context/AuthContext";
import Input from "../../components/input";
import Checkbox from "expo-checkbox";
import styles from "./Journal.style";
import colors from "../../css/colors";

type Props = NativeStackScreenProps<any, "Goal">;

const JourneyGoalScreen = ({ navigation, route }: Props) =>
{
	const { user } = useContext(AuthContext);
	const [goal, setGoal] = useState<string>("");
	const [previousGoal, setPreviousGoal] = useState<string | null>(null);
	const [goalCompleted, setGoalCompleted] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState(false);
	const [journalData, setJournalData] = useState<NavigationParams | null>(
		null
	);

	useEffect(() =>
	{
		const params = route.params as NavigationParams;

		if (params)
		{
			setJournalData(params);

			const currentGoal = params.existingData?.journal?.next_day_goal;

			if (currentGoal && currentGoal.trim() !== "")
			{
				setGoal(currentGoal);
			}

			const yesterdayGoal = params.existingData?.previous_day_goal;

			if (yesterdayGoal)
			{
				setPreviousGoal(yesterdayGoal);
			}

			const alreadyCompleted
                = params.existingData?.journal?.actual_day_goal_completed;

			if (alreadyCompleted)
			{
				setGoalCompleted(alreadyCompleted);
			}
		}
	}, [route.params]);

	const handleNext = async () =>
	{
		if (!goal || !journalData?.journalId)
		{
			return;
		}

		setIsLoading(true);
		try
		{
			await journalService.addGoal({
				id_journal: journalData.journalId,
				next_day_goal: goal,
			});

			const updatedData: NavigationParams = {
				...journalData,
				currentStep: "note",
			};

			navigation.navigate("Note", updatedData);
		}
		catch (err)
		{
			console.error(
				"Erreur lors de l'enregistrement de l'objectif:",
				err
			);
		}
		finally
		{
			setIsLoading(false);
		}
	};

	const handleCheckGoal = async (completed: boolean) =>
	{
		if (!journalData?.journalId)
		{
			return;
		}

		setIsLoading(true);
		try
		{
			await journalService.addCheckedGoal({
				id_journal: journalData.journalId,
				actual_day_goal_completed: completed,
			});
		}
		catch (err)
		{
			console.error(
				"Erreur lors de l'enregistrement de l'objectif:",
				err
			);
		}
		finally
		{
			setIsLoading(false);
		}
	};

	if (!user?.hasPremium)
	{
		return (
			<View style={styles.page}>
				<Mascot
					mascot="hey"
					text="Cette fonctionnalité est réservée aux utilisateurs Premium ✨"
				/>
				<Button
					title="Passer"
					onPress={() =>
						navigation.navigate("Main", { screen: "Follow" })
					}
				/>
			</View>
		);
	}
	else
	{
		return (
			<View style={styles.page}>
				<BackButton />
				<Mascot
					mascot="woaw"
					text="As-tu réussi à atteindre ton objectif d'hier ? Si tu veux, on peut en choisir un nouveau pour aujourd'hui."
				/>

				{previousGoal && (
					<View style={styles.inputLastGoal}>
						<Checkbox
							value={goalCompleted}
							onValueChange={async (value) =>
							{
								setGoalCompleted(value);
								await handleCheckGoal(value);
							}}
							color={colors.primary}
							style={styles.checkbox}
						/>
						<Text style={{ marginLeft: 10 }}>
                            As-tu rempli l’objectif d’hier ? « {previousGoal} »
						</Text>
					</View>
				)}

				<Input
					placeholder="Ton objectif de demain..."
					value={goal}
					onChangeText={setGoal}
					multiline
					style={{
						borderWidth: 1,
						borderColor: "#ccc",
						borderRadius: 8,
						padding: 10,
						marginVertical: 20,
						minHeight: 80,
					}}
				/>

				<Button
					title={isLoading ? "Enregistrement..." : "Suivant"}
					onPress={handleNext}
					disabled={!goal || isLoading}
				/>
			</View>
		);
	}
};

export default JourneyGoalScreen;
