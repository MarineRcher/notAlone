import {
	Text,
	View,
	FlatList,
	ActivityIndicator,
	TouchableOpacity,
} from "react-native";
import styles from "./forestScreen.style";
import Close from "../../assets/icons/x.svg";
import { TreeItem, gamesService } from "../api/gamesService";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState, useEffect } from "react";
import { NatureCard } from "../components/natureCard";
import apiConfig from "../config/api";

type Props = NativeStackScreenProps<any, "flowershop">;
const FlowerShopScreen = ({ navigation }: Props) => {
	const [flowers, setflowers] = useState<TreeItem[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"trees" | "flowers">("flowers");
	useEffect(() => {
		const fetchForest = async () => {
			try {
				const data = await gamesService.getflowers();
				setflowers(data);
			} catch (error) {
				console.error("Erreur fetch forêt:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchForest();
	}, []);

	if (loading) {
		return (
			<View style={styles.mainContainer}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<View style={styles.mainContainer}>
			<View style={[styles.popup]}>
				<View style={styles.menuToggle}>
					<TouchableOpacity
						style={[
							styles.tabButton,
							activeTab === "trees" && styles.tabButtonActive,
						]}
						onPress={() => {
							setActiveTab("trees");
							navigation.navigate("TreeShop");
						}}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === "trees" && styles.tabTextActive,
							]}
						>
							Trees
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.tabButton,
							activeTab === "flowers" && styles.tabButtonActive,
						]}
						onPress={() => {
							setActiveTab("flowers");
						}}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === "flowers" && styles.tabTextActive,
							]}
						>
							Flowers
						</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.close}>
					<TouchableOpacity
						onPress={() => navigation.navigate("Main", { screen: "Forest" })}
					>
						<Close width={48} height={48} />
					</TouchableOpacity>
				</View>

				<View style={{ width: "100%", height: "90%" }}>
					<FlatList
						data={flowers}
						keyExtractor={item => item.id_nature}
						renderItem={({ item }) => (
							<NatureCard
								svgUrl={`${apiConfig.baseURL}${item.url}`}
								points={item.points}
								item={item}
								navigation={navigation}
							/>
						)}
						numColumns={2}
						showsVerticalScrollIndicator={true}
						bounces={true}
					/>
				</View>
			</View>
		</View>
	);
};

export default FlowerShopScreen;
