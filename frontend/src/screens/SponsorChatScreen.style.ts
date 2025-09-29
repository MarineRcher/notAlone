import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},

	// Header styles
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: 50,
		paddingHorizontal: 20,
		paddingBottom: 15,
		backgroundColor: colors.background,
		borderBottomWidth: 1,
		borderBottomColor: colors.secondary,
	},

	backButton: {
		fontSize: 16,
		color: colors.primary,
		fontFamily: Fonts.quicksand.bold,
	},

	headerTitle: {
		fontSize: 18,
		fontFamily: Fonts.quicksand.bold,
		color: colors.text,
		flex: 1,
		textAlign: 'center',
	},

	headerRight: {
		alignItems: 'flex-end',
	},

	statusConnected: {
		fontSize: 12,
		color: colors.success,
		fontFamily: Fonts.quicksand.regular,
	},

	statusConnecting: {
		fontSize: 12,
		color: colors.warning,
		fontFamily: Fonts.quicksand.regular,
	},

	// Loading styles
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},

	loadingText: {
		fontSize: 16,
		color: colors.text,
		fontFamily: Fonts.quicksand.regular,
		textAlign: 'center',
		marginTop: 10,
	},

	// Messages styles
	messagesList: {
		flex: 1,
		paddingHorizontal: 20,
		paddingVertical: 10,
	},

	messageBubble: {
		maxWidth: "80%",
		marginVertical: 5,
		padding: 12,
		borderRadius: 15,
	},

	ownBubble: {
		alignSelf: "flex-end",
		backgroundColor: colors.primary,
	},

	otherBubble: {
		alignSelf: "flex-start",
		backgroundColor: colors.secondary,
	},

	ownMessageText: {
		fontSize: 14,
		fontFamily: Fonts.quicksand.regular,
		color: colors.background,
		lineHeight: 18,
	},

	otherMessageText: {
		fontSize: 14,
		fontFamily: Fonts.quicksand.regular,
		color: colors.text,
		lineHeight: 18,
	},

	ownMessageTime: {
		fontSize: 10,
		fontFamily: Fonts.quicksand.regular,
		color: colors.background,
		opacity: 0.8,
		marginTop: 4,
		textAlign: "right",
	},

	otherMessageTime: {
		fontSize: 10,
		fontFamily: Fonts.quicksand.regular,
		color: colors.text,
		opacity: 0.6,
		marginTop: 4,
		textAlign: "right",
	},

	// Input styles
	inputContainer: {
		flexDirection: "row",
		alignItems: "flex-end",
		paddingHorizontal: 20,
		paddingVertical: 15,
		borderTopWidth: 1,
		borderTopColor: colors.secondary,
		gap: 10,
	},

	messageInput: {
		flex: 1,
		minHeight: 40,
		maxHeight: 100,
		borderWidth: 1,
		borderColor: colors.secondary,
		borderRadius: 20,
		paddingHorizontal: 15,
		paddingVertical: 10,
		fontSize: 14,
		fontFamily: Fonts.quicksand.regular,
		color: colors.text,
		backgroundColor: colors.background,
	},

	sendButton: {
		backgroundColor: colors.primary,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		minHeight: 40,
	},

	sendButtonDisabled: {
		backgroundColor: colors.disable,
		opacity: 0.6,
	},

	sendButtonText: {
		fontSize: 14,
		fontFamily: Fonts.quicksand.bold,
		color: colors.background,
	},

	// Error and status styles
	errorText: {
		fontStyle: "italic",
		color: colors.error,
		opacity: 0.7,
	},

	encryptedIndicator: {
		fontSize: 10,
		color: colors.success,
		fontFamily: Fonts.quicksand.regular,
		marginTop: 2,
		textAlign: "right",
	},

	keyExchangeStatus: {
		backgroundColor: colors.warning + '20',
		padding: 10,
		marginHorizontal: 20,
		borderRadius: 8,
		marginVertical: 5,
	},

	keyExchangeText: {
		fontSize: 12,
		color: colors.warning,
		fontFamily: Fonts.quicksand.regular,
		textAlign: 'center',
	},

	// Additional styles needed by the component
	messageContainer: {
		maxWidth: "80%",
		marginVertical: 5,
		padding: 12,
		borderRadius: 15,
	},

	ownMessage: {
		alignSelf: "flex-end",
		backgroundColor: colors.primary,
	},

	otherMessage: {
		alignSelf: "flex-start",
		backgroundColor: colors.secondary,
	},

	senderName: {
		fontSize: 12,
		color: colors.textSecondary,
		marginBottom: 2,
		fontWeight: '600',
		fontFamily: Fonts.quicksand.bold,
	},

	messageText: {
		fontSize: 14,
		fontFamily: Fonts.quicksand.regular,
		color: colors.text,
		lineHeight: 18,
	},

	messageTime: {
		fontSize: 10,
		fontFamily: Fonts.quicksand.regular,
		color: colors.text,
		opacity: 0.6,
		marginTop: 4,
		textAlign: "right",
	},

	statusText: {
		fontSize: 14,
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: 16,
		fontFamily: Fonts.quicksand.regular,
	},

	retryButton: {
		backgroundColor: colors.primary,
		padding: 10,
		borderRadius: 6,
		alignItems: 'center',
		marginTop: 10,
	},

	retryButtonText: {
		color: colors.background,
		fontWeight: 'bold',
		fontSize: 14,
		fontFamily: Fonts.quicksand.bold,
	},
});

export default styles;
