import React, { useContext, useState, useEffect } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Mascot from "../../components/mascot";
import styles from "../HomeScreen.style";
import addictionService from "../../api/addictionService";
import { statsService, Acquired } from "../../api/statsService";
import { AuthContext } from "../../context/AuthContext";
import { AddictionItem } from "../HomeScreen";
import acquiredStyles from "./AcquiredScreen.style";
import BackButton from "../../components/backNavigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

interface AcquiredWithProgress extends Acquired {
	progress: number;
	isAcquired: boolean;
	timeRemaining?: number;
}

type Props = NativeStackScreenProps<any, any>;

const AcquiredScreen = ({ navigation }: Props) => {
	const { user } = useContext(AuthContext);
	const [addictions, setAddictions] = useState<AddictionItem[]>([]);
	const [selectedAddiction, setSelectedAddiction] = useState<number | null>(
		null,
	);
	const [acquiredItems, setAcquiredItems] = useState<AcquiredWithProgress[]>(
		[],
	);
	const [totalSavings, setTotalSavings] = useState<number>(0);
	const [loading, setLoading] = useState(false);

	const [open, setOpen] = useState(false);
	const [value, setValue] = useState<number | null>(null);
	const [items, setItems] = useState<{ label: string; value: number }[]>([]);

	useEffect(() => {
		loadUserAddictions();
	}, []);

	useEffect(() => {
		const mappedItems = addictions.map(addiction => ({
			label: addiction.addiction,
			value: addiction.id,
		}));

		setItems(mappedItems);
	}, [addictions]);

	useEffect(() => {
		if (selectedAddiction) {
			loadAcquiredItems(selectedAddiction);
			loadMoneySavings(selectedAddiction);
		}
	}, [selectedAddiction]);

	const loadUserAddictions = async () => {
		try {
			const response = await addictionService.getUserAddictions();
			const formatted = response.map(record => ({
				id: record.id,
				addiction: record.addiction ?? "Inconnu",
				addictionId: record.addictionId,
				phoneNumber: record.phoneNumber ?? null,
				date: record.date,
			}));

			setAddictions(formatted);

			if (formatted.length > 0) {
				const defaultId = formatted[0].id;
				setSelectedAddiction(defaultId);
				setValue(defaultId);
			}
		} catch (error) {
			console.error("Erreur lors du chargement des addictions:", error);
		}
	};

	const loadMoneySavings = async (addictionId: number) => {
		try {
			const savings = await statsService.getMoneySave(addictionId.toString());
			setTotalSavings(savings);
		} catch (error) {
			console.error("Erreur lors du chargement des économies:", error);
			setTotalSavings(0);
		}
	};

	const loadAcquiredItems = async (addictionId: number) => {
		try {
			setLoading(true);
			const response = await statsService.getAcquired(addictionId.toString());

			// Calculer le temps Ã©coulÃ© depuis l'arrÃªt en minutes
			const startDate = new Date(response.startDate);
			const now = new Date();
			const minutesElapsed = Math.floor(
				(now.getTime() - startDate.getTime()) / (1000 * 60),
			);

			// Traiter chaque Ã©lÃ©ment acquis avec calcul de progression
			const itemsWithProgress: AcquiredWithProgress[] = response.acquired
				.map(item => {
					const progress = Math.min((minutesElapsed / item.number) * 100, 100);
					const isAcquired = minutesElapsed >= item.number;
					const timeRemaining = isAcquired ? 0 : item.number - minutesElapsed;

					return {
						...item,
						progress,
						isAcquired,
						timeRemaining,
					};
				})
				.sort((a, b) => a.number - b.number);

			setAcquiredItems(itemsWithProgress);
		} catch (error) {
			console.error("Erreur lors du chargement des acquis:", error);
		} finally {
			setLoading(false);
		}
	};

	const formatMoney = (amount: number): string => {
		return new Intl.NumberFormat("fr-FR", {
			style: "currency",
			currency: "EUR",
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(amount);
	};

	const formatTimeRemaining = (minutes: number): string => {
		if (minutes < 60) {
			return `${minutes} min`;
		} else if (minutes < 1440) {
			const hours = Math.floor(minutes / 60);
			return `${hours}h`;
		} else if (minutes < 43800) {
			const days = Math.floor(minutes / 1440);
			return `${days} jour${days > 1 ? "s" : ""}`;
		} else if (minutes < 525600) {
			const months = Math.floor(minutes / 43800);
			return `${months} mois`;
		} else {
			const years = Math.floor(minutes / 525600);
			return `${years} an${years > 1 ? "s" : ""}`;
		}
	};

	const formatDuration = (minutes: number): string => {
		if (minutes < 60) {
			return `${minutes} min`;
		} else if (minutes < 1440) {
			const hours = Math.floor(minutes / 60);
			return `${hours}h`;
		} else if (minutes < 43800) {
			const days = Math.floor(minutes / 1440);
			return `${days} jour${days > 1 ? "s" : ""}`;
		} else if (minutes < 525600) {
			const months = Math.floor(minutes / 43800);
			return `${months} mois`;
		} else {
			const years = Math.floor(minutes / 525600);
			return `${years} an${years > 1 ? "s" : ""}`;
		}
	};

	// VÃ©rifier si on doit afficher la carte premium
	const shouldShowPremiumCard = () => {
		if (user?.hasPremium || acquiredItems.length === 0) return false;

		// VÃ©rifier s'il y a des acquis Ã  plus de 90 jours (129600 minutes)
		const has90DaysAcquired = acquiredItems.some(item => item.number > 129600);

		return has90DaysAcquired;
	};

	const handlePremiumUpgrade = () => {
		navigation.navigate("ActivatePremium");
	};

	const SavingsCard = () => (
		<View style={acquiredStyles.savingsCard}>
			<View style={acquiredStyles.savingsHeader}>
				<Text style={acquiredStyles.savingsTitle}>Économies réalisées</Text>
			</View>
			<Text style={acquiredStyles.savingsAmount}>
				{formatMoney(totalSavings)}
			</Text>
			<Text style={acquiredStyles.savingsSubtext}>
				depuis le début de votre parcours
			</Text>
		</View>
	);

	const PremiumCard = () => (
		<View style={acquiredStyles.premiumCard}>
			<View style={acquiredStyles.premiumHeader}>
				<Text style={acquiredStyles.premiumTitle}>Version Premium</Text>
			</View>
			<Text style={acquiredStyles.premiumDescription}>
				Débloquez tous vos acquis à long terme et accédez à des fonctionnalités
				exclusives pour soutenir votre parcours !
			</Text>
			<TouchableOpacity
				style={acquiredStyles.premiumButton}
				onPress={handlePremiumUpgrade}
			>
				<Text style={acquiredStyles.premiumButtonText}>
					Passer à la version Premium
				</Text>
			</TouchableOpacity>
		</View>
	);

	// Filtrer les acquis selon le statut premium
	const getDisplayedAcquiredItems = () => {
		if (user?.hasPremium) {
			return acquiredItems;
		}

		// Si pas premium, ne montrer que les acquis jusqu'Ã  90 jours
		return acquiredItems.filter(item => item.number <= 129600);
	};

	return (
		<KeyboardAwareScrollView
			contentContainerStyle={styles.scrollContainer}
			nestedScrollEnabled={true}
		>
			<BackButton />
			{addictions.length > 0 && (
				<View style={styles.containerPicker}>
					<DropDownPicker
						open={open}
						value={value}
						items={items}
						setOpen={setOpen}
						setValue={setValue}
						setItems={setItems}
						placeholder={items[0]?.label || "Ajoutez une addiction"}
						style={styles.picker}
						flatListProps={{
							nestedScrollEnabled: true,
						}}
						scrollViewProps={{
							nestedScrollEnabled: true,
						}}
						dropDownContainerStyle={styles.dropdownContainer}
						onChangeValue={selectedId => {
							setSelectedAddiction(selectedId);
						}}
					/>
				</View>
			)}

			<View style={styles.container}>
				<Mascot
					mascot="woaw"
					text={`Regarde le chemin parcouru : qu'as-tu déjà  acquis, et qu'est-ce qui se construit encore doucement ?`}
				/>
			</View>

			{loading ? (
				<View style={acquiredStyles.loadingContainer}>
					<Text style={acquiredStyles.loadingText}>Chargement...</Text>
				</View>
			) : (
				<View style={acquiredStyles.acquiredContainer}>
					{selectedAddiction && <SavingsCard />}

					{getDisplayedAcquiredItems().map((item, index) => (
						<View key={item.acquired_id} style={acquiredStyles.acquiredItem}>
							<View style={acquiredStyles.itemHeader}>
								<Text style={acquiredStyles.durationText}>
									{formatDuration(item.number)}
								</Text>
								<Text
									style={[
										acquiredStyles.statusText,
										item.isAcquired
											? acquiredStyles.acquiredText
											: acquiredStyles.pendingText,
									]}
								>
									{item.isAcquired
										? "Acquis"
										: `${formatTimeRemaining(item.timeRemaining!)}`}
								</Text>
							</View>

							<Text style={acquiredStyles.acquiredDescription}>
								{item.acquired}
							</Text>

							<View style={acquiredStyles.progressContainer}>
								<View style={acquiredStyles.progressBarBackground}>
									<View
										style={[
											acquiredStyles.progressBar,
											{
												width: `${item.progress}%`,
												backgroundColor: item.isAcquired
													? "#4CAF50"
													: "#FFA726",
											},
										]}
									/>
								</View>
								<Text style={acquiredStyles.progressText}>
									{Math.round(item.progress)}%
								</Text>
							</View>
						</View>
					))}

					{shouldShowPremiumCard() && <PremiumCard />}
				</View>
			)}
		</KeyboardAwareScrollView>
	);
};

export default AcquiredScreen;
