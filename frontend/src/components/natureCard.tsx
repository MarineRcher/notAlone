import styles from "./natureCard.style";
import React, { useEffect, useState, useCallback, useContext } from "react";
import {
	View,
	Text,
	ActivityIndicator,
	TouchableOpacity,
	Alert,
} from "react-native";
import Points from "../../assets/icons/points.svg";
import { SvgXml } from "react-native-svg";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TreeItem } from "../api/gamesService";
import { AuthContext } from "../context/AuthContext";

type Props = {
	svgUrl: string;
	points: number | string;
	item: TreeItem;
	navigation: NativeStackNavigationProp<any>;
};

export const NatureCard: React.FC<Props> = ({
	svgUrl,
	points,
	item,
	navigation,
}) => {
	const { user } = useContext(AuthContext);
	const [svgXml, setSvgXml] = useState<string | null>(null);

	// Fonction pour vérifier si l'item nécessite un abonnement premium
	const isPremiumItem = (item: TreeItem): boolean => {
		if (item.url) {
			const match = item.url.match(/(\d+)\.svg$/);
			if (match) {
				const number = parseInt(match[1]);
				return number >= 5 && number <= 8;
			}
		}
		return false;
	};

	const isItemLocked = isPremiumItem(item) && !user?.hasPremium;

	const fetchSvg = useCallback(async () => {
		try {
			const res = await fetch(svgUrl);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const text = await res.text();
			if (!text.trim().startsWith("<svg")) {
				throw new Error("Contenu récupéré n'est pas un SVG valide.");
			}
			setSvgXml(text);
		} catch (err: any) {
			console.log(err?.message ?? "Erreur lors du téléchargement du SVG");
		}
	}, [svgUrl]);

	useEffect(() => {
		if (!isItemLocked) {
			fetchSvg();
		}
	}, [fetchSvg, isItemLocked]);

	const showPremiumAlert = () => {
		Alert.alert(
			"Contenu Premium",
			"Cette plante est réservée aux membres Premium. Souhaitez-vous découvrir nos offres ?",
			[
				{
					text: "Plus tard",
					style: "cancel",
				},
				{
					text: "Voir Premium",
					onPress: () => {
						navigation.navigate("ActivatePremium");
					},
				},
			],
		);
	};

	const handlePress = () => {
		if (isItemLocked) {
			showPremiumAlert();
			return;
		}

		navigation.navigate("Main", {
			screen: "Forest",
			params: { placingItem: item },
		});
	};

	return (
		<View style={[styles.card, isItemLocked && styles.cardDisabled]}>
			{/* Overlay premium pour les items verrouillés */}
			{isItemLocked && (
				<View style={styles.premiumOverlay}>
					<Text style={styles.premiumText}>Premium</Text>
				</View>
			)}

			{/* SVG ou indicateur de chargement */}
			{isItemLocked ? (
				<View style={styles.lockedSvgContainer}>
					<SvgXml
						xml={svgXml || "<svg></svg>"}
						height={100}
						width={60}
						opacity={0.3}
					/>
				</View>
			) : svgXml ? (
				<SvgXml xml={svgXml} height={100} width={60} />
			) : (
				<ActivityIndicator size="small" />
			)}

			{/* Points */}
			<View
				style={[
					styles.containterPointsIcon,
					isItemLocked && styles.pointsDisabled,
				]}
			>
				<Points height={24} width={24} />
				<View
					style={[styles.pointsIcon, isItemLocked && styles.pointsIconDisabled]}
				>
					<Text
						style={[styles.colortText, isItemLocked && styles.textDisabled]}
					>
						{points}
					</Text>
				</View>
			</View>

			<TouchableOpacity
				style={[styles.button, isItemLocked && styles.buttonDisabled]}
				onPress={handlePress}
			>
				<Text
					style={[styles.buttonText, isItemLocked && styles.buttonTextDisabled]}
				>
					{isItemLocked ? "Premium requis" : "Acheter"}
				</Text>
			</TouchableOpacity>
		</View>
	);
};
