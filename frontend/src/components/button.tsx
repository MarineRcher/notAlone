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
	danger?: boolean;
	textStyle?: TextStyle;
}

const Button: React.FC<CustomButtonProps> = ({
	title,
	onPress,
	type = "primary",
	style,
	disabled = false,
	textStyle,
	danger = false,
}) =>
{
	const buttonStyle = danger
		? styles.dangerButton
		: type === "primary"
			? styles.primaryButton
			: styles.secondaryButton;

	const textStyles = [
		styles.baseText,
		styles.textButton,
		danger && styles.dangerText,
		textStyle,
	];

	return (
		<TouchableOpacity
			onPress={onPress}
			disabled={disabled}
			style={[styles.baseButton, buttonStyle, style]}
		>
			<Text style={textStyles}>{title}</Text>
		</TouchableOpacity>
	);
};

export default Button;
