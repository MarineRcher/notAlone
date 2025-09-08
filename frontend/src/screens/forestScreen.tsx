import { Text, View } from "react-native";
import styles from "./forestScreen.style";
import Points from "../../assets/icons/points.svg";
import Shop from "../../assets/icons/shopping-bag.svg";
import Platform from "../../assets/platform.svg";

const ForestScreen = () => {
	return (
		<View style={styles.mainContainer}>
			<View style={styles.topBar}>
				<View style={styles.containterPointsIcon}>
					<Points height={48} width={48} />
					<View style={styles.pointsIcon}>
						<Text style={styles.colortText}>80</Text>
					</View>
				</View>
				<View style={styles.shopIcon}>
					<Shop height={48} width={48} />
				</View>
			</View>
			<View style={styles.forest}>
				<Platform height={48} width={48} />
			</View>
		</View>
	);
};

export default ForestScreen;
