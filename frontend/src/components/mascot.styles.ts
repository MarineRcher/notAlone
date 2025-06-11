import { StyleSheet } from "react-native";
import colors from "../css/colors";
import { Fonts } from "../css/font";

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 52,
        marginHorizontal: 30,
    },
    mascotContainer: {
        width: "22%",
        alignItems: "center",
        justifyContent: "center",
    },
    mascotImage: {
        width: 90,
        height: 107,
    },
    speechBubble: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        padding: 12,
        marginLeft: 8,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    speechText: {
        fontFamily: Fonts.balsamiqSans.regular,
        fontSize: 18,
        color: colors.text,
        lineHeight: 24,
    },
});

export default styles;
