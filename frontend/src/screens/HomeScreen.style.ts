import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";
const styles = StyleSheet.create({
	scrollContainer: {
		flexGrow: 1,
		padding: 20,
		gap: 20,
	},
	container: {
		alignItems: "center",
	},
	topRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	iconWrapper: {
		width: "100%",
		justifyContent: "flex-start",
	},
	leftBox: {
		flex: 1,
		marginRight: 10,
		padding: 20,
		backgroundColor: colors.primary,
		justifyContent: "space-between",
		alignItems: "center",
		borderRadius: 25,
	},
	rightColumn: {
		flex: 1,
		marginLeft: 10,
		justifyContent: "space-between",
		gap: 10,
	},
	group: {
		backgroundColor: colors.text,
		padding: 20,
		alignItems: "center",
		borderRadius: 25,
	},
	user: {
		backgroundColor: colors.sky,
		padding: 20,
		alignItems: "center",
		borderRadius: 25,
	},
	addiction: {
		backgroundColor: colors.secondary,
		padding: 20,
		alignItems: "center",
		borderRadius: 25,
		flexDirection: "row",
		justifyContent: "center",
		gap: 16,
	},
	number: {
		borderColor: colors.text,
		borderWidth: 2,
		padding: 20,
		alignItems: "center",
		borderRadius: 25,
		flexDirection: "row",
		justifyContent: "center",
		gap: 16,
	},
	squaresText: {
		color: colors.text,
		fontFamily: Fonts.quicksand.bold,
		fontSize: 16,
		marginTop: 10,
		textAlign: "center",
	},
	userText: {
		color: colors.background,
		fontFamily: Fonts.quicksand.bold,
		fontSize: 16,
		marginTop: 10,
		textAlign: "center",
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
});

export default styles;
