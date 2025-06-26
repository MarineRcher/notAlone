import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		shadowOffset: { width: 3, height: 3 },
		elevation: 3,
		width: "90%",
		backgroundColor: colors.secondaryBackeground,
		borderRadius: 15,
		overflow: "hidden",
	},
	containerContent: {
		flex: 1,
		flexDirection: "column",
		gap: 12,
		padding: 16,
	},
	image: {
		width: "30%",
		height: "100%",
		backgroundColor: "white",
	},
	h3: {
		fontFamily: Fonts.balsamiqSans.regular,
		fontSize: 16,
		color: colors.text,
	},
	p: {
		fontFamily: Fonts.quicksand.regular,
		color: colors.text,
	},
});

export default styles;
