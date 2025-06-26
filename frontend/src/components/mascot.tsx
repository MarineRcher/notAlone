import React from "react";
import {
	View,
	Text,
	Image,
	ViewStyle,
	TextStyle,
	ImageSourcePropType,
} from "react-native";
import styles from "./mascot.styles";

type MascotType = "angry" | "happy" | "hey" | "super" | "woaw";

interface MascotSpeechProps {
	text: string;
	mascot: MascotType;
	style?: ViewStyle;
	textStyle?: TextStyle;
	speechBubbleStyle?: ViewStyle;
}

const mascotImages: Record<MascotType, ImageSourcePropType> = {
	angry: require("../../assets/mascot/angry.png"),
	happy: require("../../assets/mascot/happy.png"),
	hey: require("../../assets/mascot/hey.png"),
	super: require("../../assets/mascot/super.png"),
	woaw: require("../../assets/mascot/woaw.png"),
};

const Mascot: React.FC<MascotSpeechProps> = ({
	text,
	mascot,
	style,
	textStyle,
	speechBubbleStyle,
}) =>
{
	return (
		<View style={[styles.container, style]}>
			{/* Mascotte à gauche */}
			<View style={styles.mascotContainer}>
				<Image
					source={mascotImages[mascot]}
					style={styles.mascotImage}
					resizeMode="contain"
				/>
			</View>

			{/* Bulle de dialogue à droite */}
			<View style={[styles.speechBubble, speechBubbleStyle]}>
				<Text style={[styles.speechText, textStyle]}>{text}</Text>
			</View>
		</View>
	);
};

export default Mascot;
