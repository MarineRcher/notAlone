import React from "react";
import {
    TextInput,
    View,
    Text,
    ViewStyle,
    TextStyle,
    TextInputProps,
} from "react-native";
import styles from "./input.styles";

interface CustomInputProps extends Omit<TextInputProps, "style"> {
    style?: ViewStyle;
    textStyle?: TextStyle;
    error?: string;
    containerStyle?: ViewStyle;
    placeholder?: string;
}

const Input: React.FC<CustomInputProps> = ({
    style,
    textStyle,
    error,
    containerStyle,
    editable = true,
    placeholder = "",
    ...props
}) => {
    const isDisabled = !editable;

    return (
        <View style={[styles.container, containerStyle]}>
            <TextInput
                {...props}
                editable={editable}
                style={[
                    styles.baseInput,
                    styles.input,
                    isDisabled && styles.disabledInput,
                    style,
                    textStyle,
                ]}
                placeholder={placeholder}
                placeholderTextColor={
                    isDisabled
                        ? styles.disabledText.color
                        : styles.placeholderText.color
                }
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

export default Input;
