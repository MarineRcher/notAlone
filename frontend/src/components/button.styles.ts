import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
    baseButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        marginBottom: 32,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        maxWidth: 200,
    },
    baseText: {
        fontSize: 18,
        fontFamily: Fonts.quicksand.bold,
    },
    primaryButton: {
        backgroundColor: colors.text,
    },
    secondaryButton: {
        backgroundColor: colors.secondary,
    },
    disabledButton: {
        backgroundColor: colors.disable,
        color: colors.text,
    },
    textButton: {
        color: colors.background,
    },
});

export default styles;
