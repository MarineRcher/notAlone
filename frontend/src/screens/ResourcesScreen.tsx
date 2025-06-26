import { Text, View, TouchableOpacity, ScrollView, Alert } from "react-native";
import Mascot from "../components/mascot";
import styles from "./ResourcesScreen.style";
import addictionService from "../api/addictionService";
import { useContext, useEffect, useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import PresentLink from "../components/presentLink";
import journalService from "../api/journalService";
import resourcesService from "../api/resourcesService";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthContext } from "../context/AuthContext";

type AddictionItem = {
	id: string;
	addiction: string;
	addictionId: string;
	phoneNumber: string;
	date: string;
};
type AddictionGroup = {
	addictionId: string;
	addictionName: string;
	links: {
		id: string;
		name: string;
		name_link: string;
		resume: string;
		link: string;
		image_url: string | null;
	}[];
};

type LinkItem = {
	id: string;
	name: string;
	resume: string;
	link: string;
	image_url: string | null;
};

type Props = NativeStackScreenProps<any, "Resources">;
const ResourcesScreen = ({ navigation }: Props) => {
	const { user } = useContext(AuthContext);
	const [addictions, setAddictions] = useState<AddictionItem[]>([]);
	const [selectedAddiction, setSelectedAddiction] = useState<string | null>(
		null,
	);
	const [addictionLinks, setAddictionLinks] = useState<LinkItem[]>([]);

	const [open, setOpen] = useState(false);
	const [value, setValue] = useState<string | null>(null);
	const [items, setItems] = useState<{ label: string; value: string }[]>([]);

	useEffect(() => {
		loadUserAddictions();
	}, []);

	useEffect(() => {
		const mappedItems = addictions.map(addiction => ({
			label: addiction.addiction,
			value: addiction.addictionId,
		}));

		setItems(mappedItems);

		if (addictions.length > 0) {
			const defaultId = addictions[0].addictionId;
			setValue(defaultId);
			setSelectedAddiction(defaultId);
			fetchLinksForAddiction(defaultId);
		}
	}, [addictions]);

	const loadUserAddictions = async () => {
		try {
			const response = await addictionService.getUserAddictions();
			setAddictions(response);
		} catch (error) {
			console.error("Erreur lors du chargement des addictions:", error);
		}
	};

	const fetchLinksForAddiction = async (addictionId: string) => {
		try {
			const response = await resourcesService.getUserAddictionLinks();

			const rawData =
				typeof response.data === "string"
					? JSON.parse(response.data)
					: response.data;

			const matchingGroup = rawData.find(
				(group: AddictionGroup) => group.addictionId === addictionId,
			);
			setAddictionLinks(matchingGroup?.links || []);
		} catch (error) {
			console.error("Erreur lors de la récupération des liens:", error);
		}
	};

	const handleBreathingAccess = async () => {
		try {
			if (user?.hasPremium) {
				navigation.navigate("Breathing");
				return;
			}

			const accessResponse = await resourcesService.canAcceessAnimation();
			const accessData =
				typeof accessResponse.data === "string"
					? JSON.parse(accessResponse.data)
					: accessResponse.data;

			if (accessData.allowed) {
				await resourcesService.updateLastAnimation();
				navigation.navigate("Breathing");
			}
		} catch (error: any) {
			console.error(
				"Erreur lors de la vérification de l'accès à la respiration:",
				error,
			);

			// 👉 AxiosError spécifique : accès refusé mais données présentes
			if (error.response?.status === 403) {
				const accessData = error.response.data;

				const formattedDateTime = new Date(
					accessData.nextAccessAt,
				).toLocaleString("fr-FR", {
					weekday: "long",
					day: "2-digit",
					month: "long",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				});

				Alert.alert(
					"Accès limité",
					`Tu as déjà fait une session aujourd’hui. Reviens après ${formattedDateTime} ⏳\nOu passe à la version Premium pour un accès illimité 🚀`,
					[{ text: "OK" }],
				);
			} else {
				Alert.alert(
					"Erreur",
					"Impossible de vérifier l'accès pour le moment. Réessayez plus tard.",
					[{ text: "OK" }],
				);
			}
		}
	};

	return (
		<ScrollView style={styles.scrollContainer}>
			<View style={styles.container}>
				<Mascot
					mascot="hey"
					text="On prend une petite pause ? Je peux t’aider à respirer… et j’ai des liens utiles si tu veux jeter un œil"
				/>
				<TouchableOpacity
					onPress={handleBreathingAccess}
					style={styles.breathingButton}
				>
					<Text style={styles.h1}>Respirer 5 minutes</Text>
				</TouchableOpacity>
				{addictions.length > 0 && (
					<View style={styles.containerPicker}>
						<DropDownPicker
							open={open}
							value={value}
							items={items}
							setOpen={setOpen}
							setValue={setValue}
							setItems={setItems}
							style={styles.picker}
							placeholder={items[0]?.label || "Ajoutez une addiction"}
							dropDownContainerStyle={styles.dropdownContainer}
							onChangeValue={selectedId => {
								if (selectedId) {
									setSelectedAddiction(selectedId);
									fetchLinksForAddiction(selectedId);
								}
							}}
						/>
					</View>
				)}

				{addictionLinks.length > 0 && (
					<View style={styles.linksContainer}>
						<Text style={styles.h2}>Liens externes</Text>
						{addictionLinks.map(link => (
							<PresentLink key={link.id} link={link} />
						))}
					</View>
				)}
			</View>
		</ScrollView>
	);
};

export default ResourcesScreen;
