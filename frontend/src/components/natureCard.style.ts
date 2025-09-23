import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#FFFBFB",
		borderRadius: 16,
		shadowColor: "#000",
		shadowOffset: { width: 1, height: 1 },
		shadowOpacity: 0.8,
		shadowRadius: 1,
		width: "30%",
		flex: 1,
		margin: 16,
		padding: 8,
		gap: 8,
		justifyContent: "center",
		alignContent: "center",
		alignItems: "center",
		position: "relative",
	},
	cardDisabled: {
		backgroundColor: "#F5F5F5",
		opacity: 0.7,
	},
	premiumOverlay: {
		position: "absolute",
		top: 8,
		right: 8,
		backgroundColor: "#FFD700",
		borderRadius: 12,
		paddingHorizontal: 8,
		paddingVertical: 4,
		zIndex: 10,
	},
	premiumText: {
		fontSize: 10,
		fontWeight: "bold",
		color: "#000",
		fontFamily: Fonts.quicksand.bold,
	},
	lockedSvgContainer: {
		opacity: 0.3,
	},
	button: {
		backgroundColor: colors.text,
		borderRadius: 25,
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	buttonDisabled: {
		backgroundColor: "#CCCCCC",
		opacity: 0.5,
	},
	buttonText: {
		color: colors.background,
		fontFamily: Fonts.quicksand.regular,
	},
	buttonTextDisabled: {
		color: "#666666",
	},
	containterPointsIcon: {
		flex: 1,
		flexDirection: "row",
		alignContent: "space-between",
	},
	pointsDisabled: {
		opacity: 0.5,
	},
	pointsIcon: {
		justifyContent: "center",
		alignContent: "center",
		alignItems: "center",
		backgroundColor: "#D2CFCF",
		borderRadius: 90,
		height: 24,
		width: 48,
		marginLeft: 8,
		opacity: 0.8,
	},
	pointsIconDisabled: {
		backgroundColor: "#E5E5E5",
		opacity: 0.3,
	},
	colortText: {
		fontFamily: Fonts.quicksand.bold,
		color: colors.text,
	},
	textDisabled: {
		color: "#999999",
	},
});

export default styles;
