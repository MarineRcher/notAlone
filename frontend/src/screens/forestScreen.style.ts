import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";
const styles = StyleSheet.create({
	mainContainer: {
		flex: 1,
		justifyContent: "flex-start",
		alignItems: "center",
		backgroundColor: colors.sky,
	},
	topBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginHorizontal: 32,
		marginTop: 44,
		width: "90%",
	},
	shopIcon: {
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 999,
		backgroundColor: colors.background,
		padding: 0,
		height: 68,
		width: 68,
	},
	containterPointsIcon: {
		flex: 1,
		flexDirection: "row",
		alignContent: "space-between",
	},
	pointsIcon: {
		justifyContent: "center",
		alignContent: "center",
		alignItems: "center",
		backgroundColor: colors.background,
		borderRadius: 90,
		height: 48,
		width: 84,
		marginLeft: 8,
	},
	colortText: {
		fontFamily: Fonts.quicksand.bold,
		color: colors.text,
	},
	forest: {
		justifyContent: "center",
		alignContent: "center",
		alignItems: "center",
		height: "90%",
	},
});

export default styles;
