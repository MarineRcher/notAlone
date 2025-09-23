// Ajoutez ces styles à votre fichier HomeScreen.style.js existant

const additionalStyles = StyleSheet.create({
	// ... vos styles existants ...

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

export default additionalStyles;
