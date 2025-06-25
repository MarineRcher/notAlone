import { StyleSheet } from "react-native";
import colors from "../../css/colors";
import { Fonts } from "../../css/font";
const styles = StyleSheet.create({
	page: { flex: 1, padding: 20, alignItems: "center" },
	buttonDifficulty: {
		marginTop: 40,
	},
	wordsList: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		marginVertical: 20,
	},
	textWords: {
		color: colors.text,
		fontFamily: Fonts.quicksand.bold,
	},
	inputLastGoal: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: 10,
		backgroundColor: "white",
		borderWidth: 1,
		borderColor: colors.disable,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		color: colors.text,
		width: "100%",
	},
	checkbox: {
		borderRadius: 9999,
		width: 20,
		borderColor: colors.text,
	},
});

export default styles;
