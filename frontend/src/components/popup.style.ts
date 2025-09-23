import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	modalView: {
		backgroundColor: "white",
		borderRadius: 10,
		padding: 24,
		maxWidth: "85%",
		alignItems: "center",
		elevation: 4,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 12,
	},
	message: {
		fontSize: 16,
		textAlign: "center",
		marginBottom: 16,
	},
	button: {
		backgroundColor: "#3B82F6",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	buttonText: {
		color: "#fff",
		fontWeight: "bold",
	},
});

export default styles;
