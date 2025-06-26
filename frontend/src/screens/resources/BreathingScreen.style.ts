import { StyleSheet, Dimensions } from "react-native";
import colors from "../../css/colors";
import { Fonts } from "../../css/font";

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
		alignItems: "center",
		justifyContent: "space-evenly",
		paddingHorizontal: 20,
		paddingVertical: 40,
	},

	timerContainer: {
		backgroundColor: colors.secondaryBackeground,
		borderRadius: 20,
		paddingHorizontal: 40,
		paddingVertical: 20,
		shadowOffset: { width: 2, height: 2 },
		shadowOpacity: 0.1,
		elevation: 3,
	},

	timerText: {
		fontFamily: Fonts.balsamiqSans.regular,
		fontSize: 48,
		color: colors.text,
		textAlign: "center",
		fontWeight: "600",
	},

	breathingContainer: {
		alignItems: "center",
		justifyContent: "center",
		height: width * 0.8,
		width: width * 0.8,
	},

	breathingCircle: {
		width: width * 0.6,
		height: width * 0.6,
		borderRadius: (width * 0.6) / 2,
		backgroundColor: "#4A90E2",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
		opacity: 0.8,
	},

	instructionText: {
		position: "absolute",
		fontFamily: Fonts.quicksand.regular,
		fontSize: 24,
		color: colors.text,
		textAlign: "center",
		fontWeight: "500",
		marginTop: 20,
	},

	buttonContainer: {
		width: "100%",
		alignItems: "center",
		gap: 15,
	},

	button: {
		width: "80%",
		paddingVertical: 16,
		borderRadius: 25,
		alignItems: "center",
		shadowOffset: { width: 2, height: 2 },
		shadowOpacity: 0.2,
		elevation: 4,
	},

	startButton: {
		backgroundColor: colors.sky,
	},

	stopButton: {
		backgroundColor: "#FF6B6B",
	},

	buttonText: {
		fontFamily: Fonts.balsamiqSans.regular,
		fontSize: 20,
		color: "white",
		fontWeight: "600",
	},

	resetButton: {
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 20,
		backgroundColor: "transparent",
		borderWidth: 2,
		borderColor: colors.text,
	},

	resetButtonText: {
		fontFamily: Fonts.quicksand.regular,
		fontSize: 16,
		color: colors.text,
	},

	backButton: {
		position: "absolute",
		top: 50,
		left: 20,
		paddingVertical: 10,
		paddingHorizontal: 15,
		backgroundColor: colors.secondaryBackeground,
		borderRadius: 20,
	},

	backButtonText: {
		fontFamily: Fonts.quicksand.regular,
		fontSize: 16,
		color: colors.text,
	},
});

export default styles;
