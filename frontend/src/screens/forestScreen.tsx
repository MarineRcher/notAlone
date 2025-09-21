import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Dimensions,
	ActivityIndicator,
	TouchableOpacity,
	Alert,
} from "react-native";
import { SvgUri } from "react-native-svg";
import Points from "../../assets/icons/points.svg";
import Shop from "../../assets/icons/shopping-bag.svg";
import styles from "./forestScreen.style";
import { gamesService, ForestItem } from "../api/gamesService";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import apiConfig from "../config/api";

const { width: screenW, height: screenH } = Dimensions.get("window");
const SLOT_OFFSET_X = 40;
const SLOT_OFFSET_Y = 100;

const SvgMarker = ({ x, y, url }: { x: number; y: number; url: string }) => {
	const fullUrl = url.startsWith("http") ? url : `${apiConfig.baseURL}${url}`;

	return (
		<View style={[localStyles.marker, { left: x, top: y }]}>
			<SvgUri uri={fullUrl} width={60} height={100} />
		</View>
	);
};

type Props = NativeStackScreenProps<any, "Forest">;

const ForestScreen = ({ navigation, route }: Props) => {
	const [forest, setForest] = useState<ForestItem[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [userPoints, setUserPoints] = useState<number>(80);

	const placingItem = route.params?.placingItem || null;

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [forestData, pointsData] = await Promise.all([
					gamesService.getUserForest(),
					gamesService.getUserPoints(),
				]);
				setForest(forestData);
				setUserPoints(pointsData);
			} catch (error) {
				console.error("Erreur fetch:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	const handlePlaceItem = async (x: number, y: number) => {
		if (!placingItem) return;

		try {
			const response = await gamesService.addNature({
				id_nature: placingItem.id_nature,
				x,
				y,
				points: placingItem.points,
			});

			if (response.remainingPoints !== undefined) {
				setUserPoints(response.remainingPoints);
			}

			const updated = await gamesService.getUserForest();

			setForest(updated);
			navigation.setParams({ placingItem: null });

			// Afficher un message de succès
			Alert.alert(
				"Succès !",
				`Élément planté avec succès ! Points restants: ${response.remainingPoints || userPoints - placingItem.points}`,
				[{ text: "OK" }],
			);
		} catch (err: any) {
			console.error("Erreur placement:", err);

			// Gérer les différents types d'erreurs
			if (err.response?.status === 400) {
				Alert.alert(
					"Points insuffisants",
					`Vous n'avez pas assez de points pour acheter cet élément. Coût: ${placingItem.points} points, Vos points: ${userPoints}`,
					[
						{
							text: "Retour au shop",
							onPress: () => navigation.navigate("TreeShop"),
						},
						{
							text: "Rester ici",
							style: "cancel",
						},
					],
				);
			} else if (err.response?.status === 401) {
				Alert.alert(
					"Erreur d'authentification",
					"Vous devez être connecté pour effectuer cette action.",
					[{ text: "OK" }],
				);
			} else {
				Alert.alert(
					"Erreur",
					"Une erreur est survenue lors du placement de l'élément.",
					[{ text: "OK" }],
				);
			}

			// Annuler le mode placement en cas d'erreur
			navigation.setParams({ placingItem: null });
		}
	};

	const getAvailableSlots = (forest: ForestItem[]) => {
		const occupied = new Set(forest.map(f => `${f.x},${f.y}`));
		const slots: { x: number; y: number }[] = [];

		forest.forEach(item => {
			const candidates = [
				{ x: item.x + SLOT_OFFSET_X, y: item.y },
				{ x: item.x - SLOT_OFFSET_X, y: item.y },
				{ x: item.x, y: item.y + SLOT_OFFSET_Y },
				{ x: item.x, y: item.y - SLOT_OFFSET_Y },
			];
			candidates.forEach(pos => {
				if (!occupied.has(`${pos.x},${pos.y}`)) {
					slots.push(pos);
				}
			});
		});
		return slots;
	};

	if (loading) {
		return (
			<View
				style={[
					styles.mainContainer,
					{ justifyContent: "center", alignItems: "center" },
				]}
			>
				<ActivityIndicator size="large" color="green" />
			</View>
		);
	}

	return (
		<View style={styles.mainContainer}>
			{/* TopBar fixe */}
			<View style={styles.topBar}>
				<View style={styles.containterPointsIcon}>
					<Points height={48} width={48} />
					<View style={styles.pointsIcon}>
						<Text style={styles.colortText}>{userPoints}</Text>
					</View>
				</View>
				<View style={styles.shopIcon}>
					<TouchableOpacity onPress={() => navigation.navigate("TreeShop")}>
						<Shop height={48} width={48} />
					</TouchableOpacity>
				</View>
			</View>

			{/* Affichage conditionnel selon l'état de la forêt */}
			{forest && forest.length > 0 ? (
				<ScrollView
					style={localStyles.scrollContainer}
					contentContainerStyle={{
						width: screenW * 2,
						height: screenH * 2,
					}}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					minimumZoomScale={1}
					maximumZoomScale={3}
					pinchGestureEnabled
				>
					<View style={localStyles.map}>
						{forest.map(item =>
							item.url ? (
								<SvgMarker
									key={item.id_forest}
									x={item.x}
									y={item.y}
									url={item.url}
								/>
							) : null,
						)}

						{/* Slots de placement */}
						{placingItem &&
							(forest.length === 0 ? (
								<TouchableOpacity
									style={[localStyles.slot, { left: screenW, top: screenH }]}
									onPress={() => handlePlaceItem(screenW, screenH)}
								>
									<Text style={localStyles.slotText}>+</Text>
								</TouchableOpacity>
							) : (
								getAvailableSlots(forest).map((slot, idx) => (
									<TouchableOpacity
										key={idx}
										style={[localStyles.slot, { left: slot.x, top: slot.y }]}
										onPress={() => handlePlaceItem(slot.x, slot.y)}
									>
										<Text style={localStyles.slotText}>+</Text>
									</TouchableOpacity>
								))
							))}
					</View>
				</ScrollView>
			) : (
				<View style={localStyles.emptyForest}>
					<Text style={localStyles.emptyText}>Plantez votre premier arbre</Text>
					{placingItem && (
						<TouchableOpacity
							style={[
								localStyles.slot,
								{ left: screenW / 2 - 24, top: screenH / 2 - 24 },
							]}
							onPress={() =>
								handlePlaceItem(screenW / 2 - 24, screenH / 2 - 24)
							}
						>
							<Text style={localStyles.slotText}>+</Text>
						</TouchableOpacity>
					)}
				</View>
			)}
		</View>
	);
};

export default ForestScreen;

const localStyles = StyleSheet.create({
	scrollContainer: {
		flex: 1,
	},
	map: {
		flex: 1,
	},
	marker: {
		position: "absolute",
	},
	slot: {
		position: "absolute",
		width: 48,
		height: 48,
		borderRadius: 24,
		borderWidth: 2,
		borderColor: "green",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,255,0,0.2)",
	},
	slotText: {
		fontSize: 24,
		fontWeight: "bold",
		color: "green",
	},
	emptyForest: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	emptyText: {
		fontSize: 18,
		color: "#666",
		textAlign: "center",
		fontWeight: "500",
	},
});
