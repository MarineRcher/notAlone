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
		alignContent: "center",
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
		alignContent: "center",
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
	disabledButton: {
		opacity: 0.5,
	},
	disabledText: {
		color: colors.disable,
	},
	statsContainer: {
		backgroundColor: "#F8F9FA",
		borderRadius: 16,
		padding: 20,
		marginVertical: 16,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},

	statsTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#2C3E50",
		marginBottom: 8,
		textAlign: "center",
	},

	daysCounter: {
		fontSize: 24,
		fontWeight: "700",
		color: "#27AE60",
		textAlign: "center",
	},

	sectionContainer: {
		marginVertical: 16,
	},

	sectionTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#2C3E50",
		marginBottom: 16,
		paddingHorizontal: 8,
	},

	badgesContainer: {
		paddingHorizontal: 8,
		justifyContent: "space-around",
	},

	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 40,
	},

	emptyMessage: {
		fontSize: 16,
		color: "#7F8C8D",
		textAlign: "center",
		fontStyle: "italic",
		paddingVertical: 20,
	},

	badgeCardGrid: {
		flex: 1,
		margin: 4,
		maxWidth: "30%",
	},
});

export default styles;
