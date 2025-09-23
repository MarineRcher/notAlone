import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
	scrollContainer: {
		flexGrow: 1,
		fontFamily: Fonts.quicksand.regular,
		padding: 30,
		marginTop: 30,
	},
	titleUserScreen: {
		fontFamily: Fonts.balsamiqSans.bold,
		fontSize: 22,
		marginBottom: 16,
	},
	container: {
		flex: 1,
		justifyContent: "space-between",
		alignItems: "center",
		padding: 20,
	},
	links: {
		width: "100%",
		flex: 1,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
	},
	footer: {
		paddingTop: 60,
		alignItems: "center",
	},
	bold: {
		fontFamily: Fonts.quicksand.bold,
	},
	link: {
		fontSize: 16,
		color: colors.primary,
		fontFamily: Fonts.quicksand.bold,
		textDecorationLine: "underline",
	},
	timeButton: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-between",
	},
	notificationContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 15,
		paddingHorizontal: 10,
		backgroundColor: colors.surface,
		borderRadius: 8,
		marginVertical: 10,
	},
	notificationText: {
		fontSize: 16,
		color: colors.text,
	},
	toggleButton: {
		backgroundColor: colors.error,
		paddingHorizontal: 15,
		paddingVertical: 8,
		borderRadius: 5,
	},
	toggleButtonText: {
		color: "white",
		fontWeight: "600",
	},
	activateButton: {
		backgroundColor: colors.primary,
		paddingHorizontal: 15,
		paddingVertical: 8,
		borderRadius: 5,
	},
	activateButtonText: {
		color: "white",
		fontWeight: "600",
	},
	timeContainer: {
		backgroundColor: colors.surface,
		padding: 15,
		borderRadius: 8,
		marginVertical: 10,
	},
	timeLabel: {
		fontSize: 16,
		color: colors.text,
		marginBottom: 10,
	},
	editTimeButton: {
		backgroundColor: colors.secondary,
		paddingHorizontal: 15,
		paddingVertical: 8,
		borderRadius: 5,
		alignSelf: "flex-start",
	},
	editTimeButtonText: {
		color: "white",
		fontWeight: "600",
	},
	timeEditContainer: {
		marginTop: 10,
	},
	timeButtonText: {
		fontSize: 18,
		fontWeight: "600",
		textAlign: "center",
		color: colors.text,
	},
	timeActions: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 15,
	},
	cancelButton: {
		backgroundColor: colors.disable,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 5,
		flex: 1,
		marginRight: 10,
	},
	cancelButtonText: {
		color: "white",
		fontWeight: "600",
		textAlign: "center",
	},
	saveButton: {
		backgroundColor: colors.success,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 5,
		flex: 1,
	},
	saveButtonText: {
		color: "white",
		fontWeight: "600",
		textAlign: "center",
	},
	bottomButtons: {
		marginTop: 30,
		marginBottom: 20,
	},
	logoutButton: {
		backgroundColor: colors.secondary,
		marginVertical: 10,
	},
	deleteButton: {
		backgroundColor: colors.error,
		marginVertical: 10,
	},
});

export default styles;
