import { StyleSheet, Platform } from "react-native";

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 8,
		minHeight: 140,
		margin: 8,
		padding: 16,
		justifyContent: "space-between",
		alignItems: "center",
		position: "relative",
		borderWidth: 1,
		borderColor: "#F0F0F0",
		// Gradient effect simulation with border
		...Platform.select({
			ios: {
				shadowColor: "#4A90E2",
				shadowOpacity: 0.06,
			},
		}),
	},

	cardDisabled: {
		backgroundColor: "#F8F8F8",
		opacity: 0.6,
		shadowOpacity: 0.03,
		borderColor: "#E0E0E0",
	},

	iconContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 8,
		minHeight: 70,
	},

	placeholderIcon: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "#E8E8E8",
		borderWidth: 2,
		borderColor: "#D0D0D0",
		borderStyle: "dashed",
	},

	errorIcon: {
		fontSize: 32,
		textAlign: "center",
	},

	description: {
		fontSize: 13,
		fontWeight: "600",
		color: "#2C3E50",
		textAlign: "center",
		lineHeight: 18,
		letterSpacing: 0.2,
		maxWidth: "100%",
	},

	descriptionDisabled: {
		color: "#95A5A6",
		fontWeight: "400",
	},
});

export default styles;
