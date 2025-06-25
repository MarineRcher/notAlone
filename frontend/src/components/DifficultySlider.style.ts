import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";
const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        marginVertical: 40,
    },
    image: {
        width: 180,
        height: 210,
        marginBottom: 30,
    },
    labels: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: 280,
        marginTop: 10,
    },
    label: {
        flex: 1,
        textAlign: "center",
        color: colors.text,
        fontFamily: Fonts.quicksand.regular,
        fontSize: 16,
    },
    selectedLabel: {
        color: colors.primary,
        fontFamily: Fonts.quicksand.bold,
    },
});

export default styles;
