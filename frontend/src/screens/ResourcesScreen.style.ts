import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";
const styles = StyleSheet.create({
	scrollContainer: {
		flexGrow: 1,
		padding: 20,
		gap: 36,
	},
	container: {
		alignItems: "center",
	},
	h1: {
		fontFamily: Fonts.balsamiqSans.bold,
		fontSize: 32,
		color: colors.secondary,
	},
	h2: {
		fontFamily: Fonts.balsamiqSans.bold,
		fontSize: 22,
		color: colors.text,
	},
	picker: {
		width: 200,
		backgroundColor: "white",
		borderColor: colors.text,
		borderWidth: 1,
		fontFamily: Fonts.quicksand.regular,
		fontSize: 14,
		color: colors.text,
		borderRadius: 12,
		alignSelf: "flex-end",
	},
	dropdownContainer: {
		borderColor: colors.text,
		width: 200,
		alignSelf: "flex-end",
	},
	containerPicker: {
		marginTop: 50,
		height: 30,
		width: "100%",
	},
	linksContainer: {
		flex: 1,
		flexDirection: "column",
		gap: 12,
	},
	breathingButton: {
		backgroundColor: colors.text,
		color: colors.secondary,
		padding: 20,
		alignItems: "center",
		borderRadius: 25,
		flexDirection: "row",
		justifyContent: "center",
		gap: 16,
		width: "100%",
	},
});

export default styles;
