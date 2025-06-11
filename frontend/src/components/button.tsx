import React from "react";
import {
    TouchableOpacity,
    Text,
    ViewStyle,
    TextStyle,
    GestureResponderEvent,
} from "react-native";
import styles from "./button.styles";

type ButtonType = "primary" | "secondary";

interface CustomButtonProps {
    title: string;
    onPress: (event: GestureResponderEvent) => void;
    type?: ButtonType;
    style?: ViewStyle;
    disabled?: boolean;
    textStyle?: TextStyle;
}

const button: React.FC<CustomButtonProps> = ({
    title,
    onPress,
    type = "primary",
    style,
    disabled = false,
    textStyle,
}) => {
    const buttonStyle =
        type === "primary" ? styles.primaryButton : styles.secondaryButton;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[styles.baseButton, buttonStyle, style]}
        >
            <Text style={[styles.baseText, styles.textButton, textStyle]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

export default button;
