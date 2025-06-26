import React from "react";
import {
	TouchableOpacity,
	Text,
	GestureResponderEvent,
	View,
} from "react-native";
import styles from "./LinkPremium.style";
import CrownIcon from "../../assets/icons/crown.svg";
import colors from "../css/colors";

interface link {
	title: string;
	onPress: (event: GestureResponderEvent) => void;
}

const Link: React.FC<link> = ({ title, onPress }) =>
{
	return (
		<TouchableOpacity onPress={onPress} style={styles.baseLink}>
			<View style={styles.circle}>
				<CrownIcon width={48} height={48} fill={colors.text} />
			</View>
			<Text style={styles.linktStyles}>{title}</Text>
		</TouchableOpacity>
	);
};

export default Link;
