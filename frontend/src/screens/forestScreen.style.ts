import { Dimensions, StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";
const { width, height } = Dimensions.get("window");

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
	popup: {
		marginTop: 60,
		paddingTop: 60,
		marginBottom: 60,
		backgroundColor: colors.background,
		borderRadius: 15,
		shadowColor: "#000",
		shadowOffset: { width: 1, height: 1 },
		shadowOpacity: 0.8,
		shadowRadius: 1,
		width: "80%",
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	close: { position: "absolute", top: 16, right: 16, zIndex: 1 },
	menuToggle: {
		flexDirection: "row",
		borderRadius: 15,
		backgroundColor: "#DBDBDB",
		padding: 4,
		width: "60%",
	},

	tabButton: {
		flex: 1,
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},

	tabButtonActive: {
		backgroundColor: "#FFF5F5",
	},

	tabText: {
		fontFamily: Fonts.quicksand.bold,
		color: colors.text,
	},

	tabTextActive: {
		color: colors.text,
	},
});

export default styles;
