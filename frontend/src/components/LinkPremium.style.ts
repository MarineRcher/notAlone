import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
	baseLink: {
		margin: 20,
		padding: 16,
		flex: 1,
		alignItems: "center",
		backgroundColor: colors.text,
		borderRadius: 25,
		gap: 12,
	},
	circle: {
		borderRadius: 50,
		backgroundColor: colors.secondary,
		alignItems: "center",
		justifyContent: "center",
		padding: 4,
	},
	linktStyles: {
		color: colors.background,
		fontFamily: Fonts.balsamiqSans.regular,
		fontSize: 18,
	},
});

export default styles;
