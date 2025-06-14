import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
    baseLink: {
        margin: 20,
    },
    linktStyles: {
        color: colors.text,
        fontFamily: Fonts.balsamiqSans.regular,
        fontSize: 18,
    },
});

export default styles;
