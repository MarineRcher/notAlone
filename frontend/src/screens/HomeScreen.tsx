import {
	ScrollView,
	Text,
	TouchableOpacity,
	View,
	Linking,
	Alert,
} from "react-native";
import { useState, useEffect } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import Mascot from "../components/mascot";
import styles from "./HomeScreen.style";
import CheckCircle from "../../assets/icons/check-circle.svg";
import User from "../../assets/icons/menu/user.svg";
import Plus from "../../assets/icons/plus-white.svg";
import Phone from "../../assets/icons/phone.svg";
import GroupUsers from "../../assets/icons/user-group.svg";
import colors from "../css/colors";
import addictionService from "../api/addictionService";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type AddictionItem = {
	id: number;
	addiction: string;
	addictionId: number;
	phoneNumber: string;
	date: string;
};

const HomeScreen = ({ navigation }) => 
{
	const [addictions, setAddictions] = useState<AddictionItem[]>([]);
	const [selectedAddiction, setSelectedAddiction] = useState<number | null>(
		null
	);
	const [daysSinceStop, setDaysSinceStop] = useState(0);
	const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

	const [open, setOpen] = useState(false);
	const [value, setValue] = useState<number | null>(null);
	const [items, setItems] = useState<{ label: string; value: number }[]>([]);

	useEffect(() => 
{
		loadUserAddictions();
	}, []);

	useEffect(() => 
{
		const mappedItems = addictions.map((addiction) => ({
			label: addiction.addiction,
			value: addiction.id,
		}));

		setItems(mappedItems);
	}, [addictions]);

	const loadUserAddictions = async () => 
{
		try 
{
			const response = await addictionService.getUserAddictions();
			const formatted = response.map((record) => ({
				id: record.id,
				addiction: record.addiction ?? "Inconnu",
				addictionId: record.addictionId,
				phoneNumber: record.phoneNumber ?? null,
				date: record.date,
			}));

			setAddictions(formatted);

			if (formatted.length > 0) 
{
				const defaultId = formatted[0].id;

				setSelectedAddiction(defaultId);
				setValue(defaultId);
				calculateDaysSinceStop(formatted[0].date);
				setPhoneNumber(formatted[0].phoneNumber);
			}
		} catch (error) {
			console.error("Erreur lors du chargement des addictions:", error);
		}
	};

	const calculateDaysSinceStop = (stopDate: string | null) => 
{
		if (!stopDate) 
{
			setDaysSinceStop(0);
			return;
		}

		const today = new Date();
		const stop = new Date(stopDate);
		const diffTime = Math.abs(today.getTime() - stop.getTime());
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		setDaysSinceStop(diffDays);
	};

	const handlePhoneCall = () => 
{
		if (!phoneNumber) 
{
			Alert.alert(
				"Aucun numéro",
				"Aucun numéro de téléphone n'est disponible pour cette addiction."
			);
			return;
		}

		const phoneUrl = `tel:${phoneNumber}`;

		Linking.canOpenURL(phoneUrl).then((supported) => 
{
			if (supported) 
{
				Linking.openURL(phoneUrl);
			} else {
				Alert.alert("Erreur", "Impossible de passer l'appel.");
			}
		});
	};

	return (
		<KeyboardAwareScrollView
			contentContainerStyle={styles.scrollContainer}
			nestedScrollEnabled={true}
		>
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
						onChangeValue={(selectedId) => 
{
							setSelectedAddiction(selectedId);
							const selectedAddictionData = addictions.find(
								(a) => a.id === selectedId
							);

							if (selectedAddictionData)
{
								calculateDaysSinceStop(
									selectedAddictionData.date
								);
								setPhoneNumber(
									selectedAddictionData.phoneNumber
								);
							}
						}}
					/>
				</View>
			)}

			<View style={styles.container}>
				<Mascot
					mascot="woaw"
					text={`${daysSinceStop} jours de victoire, petit à petit… et je suis là pour les suivants.`}
				/>
			</View>

			<View style={styles.topRow}>
				<View style={styles.leftBox}>
					<View style={styles.iconWrapper}>
						<CheckCircle width={36} height={36} />
					</View>
					<Text style={styles.squaresText}>Vos badges</Text>
				</View>

				<View style={styles.rightColumn}>
					<View style={styles.group}>
						<GroupUsers width={36} height={36} />
						<Text style={styles.userText}>Cercle de parole</Text>
					</View>
					<View style={styles.user}>
						<User width={36} height={36} />
						<Text style={styles.squaresText}>
							Parler avec votre parain
						</Text>
					</View>
				</View>
			</View>

			<View style={styles.addiction}>
				<Plus width={36} height={36} fill={colors.background} />
				<TouchableOpacity
					onPress={() => 
{
						navigation.navigate("AddUserAddiction");
					}}
				>
					<Text style={styles.userText}>Ajouter une addiction</Text>
				</TouchableOpacity>
			</View>

			<TouchableOpacity style={styles.number} onPress={handlePhoneCall}>
				<Phone width={36} height={36} />
				<Text style={styles.squaresText}>Appeler une aide anonyme</Text>
			</TouchableOpacity>

			{/* Group Chat Button */}
			<TouchableOpacity
				style={[styles.group, { marginHorizontal: 0, marginTop: 15 }]}
				onPress={() => navigation.navigate("GroupChat")}
			>
				<GroupUsers width={36} height={36} />
				<Text style={styles.squaresText}>Group Chat</Text>
			</TouchableOpacity>
		</KeyboardAwareScrollView>
	);
};

export default HomeScreen;
