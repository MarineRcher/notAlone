import { StyleSheet } from "react-native";

const acquiredStyles = StyleSheet.create({
	loadingContainer: {
		padding: 20,
		alignItems: "center",
	},
	loadingText: {
		fontSize: 16,
		color: "#666",
	},
	acquiredContainer: {
		padding: 16,
	},
	acquiredItem: {
		backgroundColor: "#f8f9fa",
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
		color: "#2196F3",
	},
	statusText: {
		fontSize: 12,
		fontWeight: "600",
	},
	acquiredText: {
		color: "#4CAF50",
	},
	pendingText: {
		color: "#FF9800",
	},
	acquiredDescription: {
		fontSize: 14,
		color: "#333",
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
		color: "#666",
		minWidth: 35,
		textAlign: "right",
	},
});

export default acquiredStyles;
