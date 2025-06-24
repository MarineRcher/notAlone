import React from "react";
import { TouchableOpacity, Text, GestureResponderEvent } from "react-native";
import styles from "./linkUserAccount.style";

interface link {
	title: string;
	onPress: (event: GestureResponderEvent) => void;
}

const LinkPremium: React.FC<link> = ({ title, onPress }) => 
{
	return (
		<TouchableOpacity onPress={onPress} style={[styles.baseLink]}>
			<Text style={styles.linktStyles}>{title}</Text>
		</TouchableOpacity>
	);
};

export default LinkPremium;
