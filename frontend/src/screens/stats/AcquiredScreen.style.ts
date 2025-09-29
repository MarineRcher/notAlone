import { StyleSheet } from "react-native";
import colors from "../../css/colors";
import { Fonts } from "../../css/font";

const acquiredStyles = StyleSheet.create({
	loadingContainer: {
		padding: 20,
		alignItems: "center",
	},
	loadingText: {
		fontSize: 16,
		color: colors.text,
	},
	acquiredContainer: {
		padding: 16,
	},
	acquiredItem: {
		backgroundColor: colors.background,
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 3.84,
		elevation: 5,
	},
	itemHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	durationText: {
		fontSize: 14,
		fontWeight: "bold",
		color: colors.primary,
	},
	statusText: {
		fontSize: 12,
		fontWeight: "600",
	},
	acquiredText: {
		fontFamily: Fonts.quicksand.regular,
		color: colors.text,
	},
	pendingText: {
		fontFamily: Fonts.quicksand.regular,
		color: colors.text,
	},
	acquiredDescription: {
		fontSize: 14,
		fontFamily: Fonts.quicksand.regular,
		color: colors.text,
		marginBottom: 12,
		lineHeight: 20,
	},
	progressContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	progressBarBackground: {
		flex: 1,
		height: 8,
		backgroundColor: "#e0e0e0",
		borderRadius: 4,
		overflow: "hidden",
	},
	progressBar: {
		height: "100%",
		borderRadius: 4,
	},
	progressText: {
		fontSize: 12,
		fontWeight: "600",
		color: colors.secondary,
		minWidth: 35,
		textAlign: "right",
	},
	premiumCard: {
		backgroundColor: colors.background,
		borderRadius: 16,
		padding: 20,
		marginTop: 16,
		shadowColor: colors.text,
		shadowOffset: {
			width: 0,
			height: 8,
		},
		shadowOpacity: 0.3,
		shadowRadius: 10,
		elevation: 8,
		borderWidth: 1,
		borderColor: colors.text,
	},
	premiumHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	premiumIcon: {
		fontSize: 24,
		marginRight: 8,
	},
	premiumTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: colors.text,
		fontFamily: Fonts.quicksand.bold,
	},
	premiumDescription: {
		fontSize: 14,
		color: colors.text,
		lineHeight: 20,
		marginBottom: 16,
		fontFamily: Fonts.quicksand.regular,
	},
	premiumButton: {
		backgroundColor: colors.text,
		borderRadius: 12,
		paddingVertical: 12,
		paddingHorizontal: 20,
		alignItems: "center",
		shadowColor: "black",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 5,
	},
	premiumButtonText: {
		color: colors.background,
		fontSize: 16,
		fontWeight: "600",
		fontFamily: Fonts.quicksand.bold,
	},
	savingsCard: {
		backgroundColor: colors.primary,
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 6,
	},
	savingsHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	savingsIcon: {
		fontSize: 24,
		marginRight: 8,
	},
	savingsTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: colors.background,
		fontFamily: Fonts.quicksand.bold,
	},
	savingsAmount: {
		fontSize: 28,
		fontWeight: "bold",
		color: colors.background,
		fontFamily: Fonts.quicksand.bold,
		textAlign: "center",
		marginVertical: 8,
	},
	savingsSubtext: {
		fontSize: 14,
		color: colors.background,
		opacity: 0.9,
		textAlign: "center",
		fontFamily: Fonts.quicksand.regular,
	},
});

export default acquiredStyles;
