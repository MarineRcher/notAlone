import { View, Text, FlatList, Alert } from "react-native";
import { useState, useEffect, useContext } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import Mascot from "../components/mascot";
import { BadgeCard } from "../components/badgeCard";
import { badgeService, BadgeItem } from "../api/badgeService";
import styles from "./HomeScreen.style";
import addictionService from "../api/addictionService";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthContext } from "../context/AuthContext";
import BackButton from "../components/backNavigation";
import apiConfig from "../config/api";

type AddictionItem = {
	id: number;
	addiction: string;
	addictionId: number;
	phoneNumber: string;
	date: string;
};

type Props = NativeStackScreenProps<any, any>;

const BadgeScreen = ({ navigation }: Props) => {
	const { user } = useContext(AuthContext);
	const [addictions, setAddictions] = useState<AddictionItem[]>([]);
	const [selectedAddiction, setSelectedAddiction] = useState<number | null>(
		null,
	);
	const [badges, setBadges] = useState<BadgeItem[]>([]);

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
			loadBadges();
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
			Alert.alert("Erreur", "Impossible de charger vos addictions");
		}
	};

	const loadBadges = async () => {
		if (!selectedAddiction) return;
		try {
			const badgesData = await badgeService.getUserBadges(selectedAddiction);
			setBadges(badgesData);
		} catch (error) {
			console.error("Erreur lors du chargement des badges:", error);
			Alert.alert("Erreur", "Impossible de charger les badges");
			setBadges([]);
		}
	};

	const renderBadgeItem = ({ item }: { item: BadgeItem }) => {
		const fullUrl = item.url.startsWith("http")
			? item.url
			: `${apiConfig.baseURL}${item.url}`;

		return (
			<BadgeCard
				svgUrl={fullUrl}
				description={`${item.name}\n${item.time_in_days}j`}
				testID={`badge-${item.badge_id}`}
			/>
		);
	};

	const renderSection = (
		title: string,
		data: BadgeItem[],
		emptyMessage: string,
	) => {
		if (data.length === 0) {
			return (
				<View style={styles.sectionContainer}>
					<Text style={styles.sectionTitle}>{title}</Text>
					<Text style={styles.emptyMessage}>{emptyMessage}</Text>
				</View>
			);
		}

		return (
			<View style={styles.sectionContainer}>
				<Text style={styles.sectionTitle}>{title}</Text>
				<FlatList
					data={data}
					renderItem={renderBadgeItem}
					keyExtractor={item => item.badge_id}
					numColumns={3}
					scrollEnabled={false}
					contentContainerStyle={styles.badgesContainer}
				/>
			</View>
		);
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
						flatListProps={{ nestedScrollEnabled: true }}
						scrollViewProps={{ nestedScrollEnabled: true }}
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
					text="Félicitations, tes efforts portent leurs fruits. Ces badges sont la preuve de ton avancée."
				/>
			</View>
			{renderSection("Mes badges", badges, "Aucun badge gagné pour le moment")}
		</KeyboardAwareScrollView>
	);
};

export default BadgeScreen;
