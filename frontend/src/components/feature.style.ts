import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
	featureContainer: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	text: {
		fontFamily: Fonts.quicksand.regular,
		color: colors.text,
	},
});

export default styles;
