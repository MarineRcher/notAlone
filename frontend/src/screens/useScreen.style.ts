import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        fontFamily: Fonts.quicksand.regular,
        padding: 30,
        marginTop: 30,
    },
    titleUserScreen: {
        fontFamily: Fonts.balsamiqSans.bold,
        fontSize: 22,
        marginBottom: 16,
    },
    container: {
        flex: 1,
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
    },
    links: {
        width: "100%",
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    footer: {
        paddingTop: 60,
        alignItems: "center",
    },
    bold: {
        fontFamily: Fonts.quicksand.bold,
    },
    link: {
        fontSize: 16,
        color: colors.primary,
        fontFamily: Fonts.quicksand.bold,
        textDecorationLine: "underline",
    },
    timeButton: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
    },
});

export default styles;
