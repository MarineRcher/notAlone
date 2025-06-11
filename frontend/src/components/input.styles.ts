// input.styles.ts
import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
    container: {
        width: "100%",
        maxWidth: 400,
        marginBottom: 16,
    },

    baseInput: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        fontSize: 16,
        fontFamily: Fonts.quicksand.regular,
        borderWidth: 1,
    },

    input: {
        width: "100%",
        backgroundColor: colors.background,
        borderColor: colors.text,
        color: colors.text,
    },

    disabledInput: {
        backgroundColor: colors.disable,
        borderColor: colors.disable,
        color: colors.text,
        opacity: 0.6,
    },
    errorText: {
        fontSize: 12,
        fontFamily: Fonts.quicksand.regular,
        color: colors.error,
        marginTop: 4,
        marginLeft: 4,
    },
    placeholderText: {
        color: colors.text + "80",
    },
    disabledText: {
        color: colors.text + "60",
    },
});

export default styles;
