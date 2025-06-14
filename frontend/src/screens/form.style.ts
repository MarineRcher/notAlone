import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        fontFamily: Fonts.quicksand.regular,
    },

    formSection: {
        flex: 1,
        width: "90%",
        marginTop: 80,
    },
    formWrapper: {
        width: "100%",
        flex: 1,
        alignItems: "center",
    },

    container: {
        flex: 1,
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
    },
    link: {
        fontSize: 16,
        color: colors.primary,
        fontFamily: Fonts.quicksand.bold,
        textDecorationLine: "underline",
    },
    text: {
        fontSize: 16,
    },
    inlineLink: {
        marginBottom: 63,
        flexDirection: "row",
        fontFamily: Fonts.quicksand.regular,
    },
    inlineLinkLogin: {
        marginBottom: 63,
        fontFamily: Fonts.quicksand.regular,
        justifyContent: "center",
        alignItems: "center",
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 32,
        height: "70%",
    },
    pickerItem: {
        fontFamily: Fonts.quicksand.regular,
        fontSize: 14,
        color: colors.text,
    },
});

export default styles;
