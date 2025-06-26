import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},

	welcomeContainer: {
		flex: 1,
		padding: 20,
		justifyContent: "center",
		alignItems: "center",
		gap: 30,
	},

	infoContainer: {
		backgroundColor: colors.secondary,
		padding: 20,
		borderRadius: 15,
		width: "100%",
		alignItems: "center",
	},

	infoTitle: {
		fontSize: 18,
		fontFamily: Fonts.quicksand.bold,
		color: colors.text,
		marginBottom: 10,
		textAlign: "center",
	},

	infoText: {
		fontSize: 14,
		fontFamily: Fonts.quicksand.regular,
		color: colors.text,
		textAlign: "center",
		lineHeight: 20,
	},

	statusText: {
		fontSize: 14,
		color: colors.secondary,
		textAlign: "center",
		marginTop: 16,
	},

	chatContainer: {
		flex: 1,
		paddingHorizontal: 20,
	},

	groupInfo: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingTop: 70,
		paddingBottom: 10,
		borderBottomWidth: 1,
		borderBottomColor: colors.secondary,
		marginBottom: 10,
	},

	groupTitle: {
		fontSize: 16,
		fontFamily: Fonts.quicksand.bold,
		color: colors.text,
	},

	leaveButton: {
		backgroundColor: colors.primary,
		paddingHorizontal: 15,
		paddingVertical: 8,
		borderRadius: 20,
	},

	leaveButtonText: {
		fontSize: 12,
		fontFamily: Fonts.quicksand.bold,
		color: colors.background,
	},

	messagesList: {
		flex: 1,
		paddingVertical: 10,
	},

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

	messageText: {
		fontSize: 14,
		fontFamily: Fonts.quicksand.regular,
		color: colors.text,
		lineHeight: 18,
	},

	errorText: {
		fontStyle: "italic",
		color: colors.text,
		opacity: 0.7,
	},

	messageTime: {
		fontSize: 10,
		fontFamily: Fonts.quicksand.regular,
		color: colors.text,
		opacity: 0.6,
		marginTop: 4,
		textAlign: "right",
	},

	inputContainer: {
		flexDirection: "row",
		alignItems: "flex-end",
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

	sendButtonText: {
		fontSize: 14,
		fontFamily: Fonts.quicksand.bold,
		color: colors.background,
	},

	// Waitroom styles
	waitroomContainer: {
		backgroundColor: colors.background,
		borderRadius: 12,
		padding: 20,
		margin: 16,
		borderWidth: 1,
		borderColor: colors.primary + '20',
		alignItems: 'center',
	},

	waitroomTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: colors.primary,
		marginBottom: 8,
		textAlign: 'center',
	},

	waitroomMessage: {
		fontSize: 16,
		color: colors.text,
		textAlign: 'center',
		marginBottom: 8,
	},

	waitroomCount: {
		fontSize: 14,
		color: colors.secondary,
		textAlign: 'center',
		marginBottom: 12,
		fontWeight: '600',
	},

	waitroomHelp: {
		fontSize: 12,
		color: colors.secondary,
		textAlign: 'center',
		marginBottom: 16,
		lineHeight: 16,
	},

	cancelButton: {
		backgroundColor: colors.secondary,
		minWidth: 120,
	},

	// System message styles
	systemMessageContainer: {
		alignItems: 'center',
		backgroundColor: colors.sky + '20',
		borderRadius: 12,
		marginVertical: 4,
		paddingVertical: 8,
		paddingHorizontal: 16,
	},

	systemMessageText: {
		color: colors.secondary,
		fontSize: 14,
		fontStyle: 'italic',
		textAlign: 'center',
	},

	// Message sender styles
	currentUserMessage: {
		alignSelf: 'flex-end',
		backgroundColor: colors.primary,
	},

	otherUserMessage: {
		alignSelf: 'flex-start',
		backgroundColor: colors.secondaryBackeground,
	},

	senderName: {
		fontSize: 12,
		color: colors.secondary,
		marginBottom: 2,
		fontWeight: '600',
	},

	sentIndicator: {
		fontSize: 10,
		color: colors.background,
		marginBottom: 2,
		fontWeight: '600',
		textAlign: 'right',
	},

	encryptedMessageText: {
		fontStyle: 'italic',
		color: colors.error,
	},
});

export default styles;