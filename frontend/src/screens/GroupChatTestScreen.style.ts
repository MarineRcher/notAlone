import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 20,
        fontFamily: Fonts.quicksand.bold,
        color: colors.background,
        textAlign: "center",
        marginBottom: 8,
    },
    headerInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    connectionStatus: {
        flexDirection: "row",
        alignItems: "center",
    },
    encryptionStatus: {
        flexDirection: "row",
        alignItems: "center",
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    connected: {
        backgroundColor: "#4CAF50",
    },
    disconnected: {
        backgroundColor: "#F44336",
    },
    statusText: {
        fontSize: 12,
        fontFamily: Fonts.quicksand.regular,
        color: colors.background + "CC",
    },
    groupInfo: {
        fontSize: 12,
        fontFamily: Fonts.quicksand.regular,
        color: colors.background + "CC",
    },
    
    // Main content area
    content: {
        flex: 1,
    },
    
    // When not in a group - join screen
    joinContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    joinTitle: {
        fontSize: 24,
        fontFamily: Fonts.quicksand.bold,
        color: colors.text,
        textAlign: "center",
        marginBottom: 10,
    },
    joinSubtitle: {
        fontSize: 16,
        fontFamily: Fonts.quicksand.regular,
        color: colors.text + "80",
        textAlign: "center",
        marginBottom: 30,
        lineHeight: 22,
    },
    joinButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 25,
        minWidth: 200,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    joinButtonText: {
        color: colors.background,
        fontSize: 16,
        fontFamily: Fonts.quicksand.bold,
        textAlign: "center",
    },
    joinButtonDisabled: {
        backgroundColor: colors.text + "40",
        shadowOpacity: 0,
        elevation: 0,
    },
    
    // Chat interface
    chatContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    messageContainer: {
        marginVertical: 4,
        maxWidth: "80%",
    },
    ownMessage: {
        alignSelf: "flex-end",
    },
    otherMessage: {
        alignSelf: "flex-start",
    },
    senderName: {
        fontSize: 11,
        fontFamily: Fonts.quicksand.regular,
        color: colors.text + "70",
        marginBottom: 3,
        marginLeft: 12,
    },
    ownSenderName: {
        textAlign: "right",
        marginRight: 12,
        marginLeft: 0,
    },
    messageText: {
        fontSize: 15,
        fontFamily: Fonts.quicksand.regular,
        lineHeight: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        overflow: "hidden",
    },
    ownMessageText: {
        backgroundColor: colors.primary,
        color: colors.background,
    },
    otherMessageText: {
        backgroundColor: colors.text + "10",
        color: colors.text,
    },
    messageTime: {
        fontSize: 10,
        fontFamily: Fonts.quicksand.regular,
        color: colors.text + "50",
        marginTop: 2,
        marginHorizontal: 12,
    },
    ownMessageTime: {
        textAlign: "right",
    },
    
    // Input area
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 15,
        paddingVertical: 12,
        paddingBottom: 20,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.text + "15",
    },
    messageInputWrapper: {
        flex: 1,
        position: "relative",
    },
    messageInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.text + "20",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        fontFamily: Fonts.quicksand.regular,
        color: colors.text,
        backgroundColor: colors.background,
        maxHeight: 100,
        marginRight: 10,
    },
    encryptionWarning: {
        position: "absolute",
        top: -25,
        left: 0,
        right: 10,
        backgroundColor: colors.primary + "15",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.primary + "30",
    },
    encryptionWarningText: {
        fontSize: 11,
        fontFamily: Fonts.quicksand.regular,
        color: colors.primary,
        textAlign: "center",
    },
    sendButton: {
        backgroundColor: colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    sendButtonDisabled: {
        backgroundColor: colors.text + "30",
        shadowOpacity: 0,
        elevation: 0,
    },
    sendButtonText: {
        color: colors.background,
        fontSize: 14,
        fontFamily: Fonts.quicksand.bold,
    },
    
    // Leave button in header area
    leaveButton: {
        backgroundColor: "#F44336",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 8,
        alignSelf: "center",
    },
    leaveButtonText: {
        color: colors.background,
        fontSize: 12,
        fontFamily: Fonts.quicksand.bold,
    },
    
    // Authentication styles
    subtitle: {
        fontSize: 14,
        fontFamily: Fonts.quicksand.regular,
        color: colors.background + "CC",
        textAlign: "center",
        marginTop: 4,
    },
    authContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    authTitle: {
        fontSize: 24,
        fontFamily: Fonts.quicksand.bold,
        color: colors.text,
        textAlign: "center",
        marginBottom: 10,
    },
    authSubtitle: {
        fontSize: 16,
        fontFamily: Fonts.quicksand.regular,
        color: colors.text + "80",
        textAlign: "center",
        marginBottom: 30,
        lineHeight: 22,
    },
    authButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 25,
        minWidth: 200,
        marginBottom: 15,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    authButtonText: {
        color: colors.background,
        fontSize: 16,
        fontFamily: Fonts.quicksand.bold,
        textAlign: "center",
    },
    authSecondaryButton: {
        backgroundColor: colors.text + "20",
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 25,
        minWidth: 200,
    },
    authSecondaryButtonText: {
        color: colors.text,
        fontSize: 16,
        fontFamily: Fonts.quicksand.regular,
        textAlign: "center",
    },
    
    // Debug controls
    debugControls: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.text + "15",
    },
    button: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 15,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    debugButton: {
        backgroundColor: "#FF9800", // Orange for debug actions
    },
    buttonText: {
        color: colors.background,
        fontSize: 14,
        fontFamily: Fonts.quicksand.bold,
        textAlign: "center",
    },
}); 