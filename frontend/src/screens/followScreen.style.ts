import { StyleSheet } from "react-native";
import { Fonts } from "../css/font";
import colors from "../css/colors";

const styles = StyleSheet.create({
	containerCalendar: {
		flex: 1,
		width: "100%",
		alignItems: "center",
		paddingBottom: 10,
	},
	calendar: {
		width: 300,
		flex: 1,
		maxHeight: 400,
	},
	FollowPage: {
		flex: 1,
	},
	title: {
		fontFamily: Fonts.balsamiqSans.bold,
		fontSize: 22,
		marginBottom: 12,
	},
	lightTitle: {
		fontFamily: Fonts.balsamiqSans.bold,
		fontSize: 22,
		color: colors.background,
	},
	stats: {
		marginVertical: 32,
		marginHorizontal: 16,
	},
	boxAcquired: {
		width: "100%",
		borderRadius: 12,
		backgroundColor: colors.text,
		color: colors.background,
		paddingHorizontal: 16,
		paddingVertical: 32,
		justifyContent: "center",
	},
});

export default styles;
