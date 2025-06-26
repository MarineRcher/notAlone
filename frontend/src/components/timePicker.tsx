import React from "react";
import { TouchableOpacity, Text, View, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import styles from "./input.styles";

interface CustomTimePickerProps {
	value: Date;
	onChange: (date: Date) => void;
	placeholder?: string;
	showPicker: boolean;
	setShowPicker: (show: boolean) => void;
	error?: string;
}

const TimePicker: React.FC<CustomTimePickerProps> = ({
	value,
	onChange,
	placeholder = "Sélectionnez une heure",
	showPicker,
	setShowPicker,
	error,
}) =>
{
	const handleChange = (event, selectedDate) =>
	{
		if (Platform.OS === "android")
		{
			setShowPicker(false);
		}

		if (event?.type === "set" && selectedDate)
		{
			onChange(selectedDate);
		}

		if (event?.type === "dismissed")
		{
			setShowPicker(false);
		}
	};

	const formatToHHMM = (dateObj: Date): string =>
	{
		const h = dateObj.getHours().toString().padStart(2, "0");
		const m = dateObj.getMinutes().toString().padStart(2, "0");

		return `${h}:${m}`;
	};

	const displayValue = value ? formatToHHMM(value) : placeholder;
	const isPlaceholder = !value;

	return (
		<View style={styles.container}>
			<TouchableOpacity
				onPress={() => setShowPicker(true)}
				style={[styles.baseInput, styles.input]}
				activeOpacity={0.7}
			>
				<Text
					style={{
						color: isPlaceholder ? "#aaa" : "#000",
						fontSize: 16,
						fontFamily: "Quicksand-Regular",
					}}
				>
					{displayValue}
				</Text>
			</TouchableOpacity>

			{showPicker && (
				<DateTimePicker
					value={value}
					mode="time"
					display={Platform.OS === "ios" ? "spinner" : "default"}
					is24Hour={true}
					onChange={handleChange}
				/>
			)}

			{error && <Text style={styles.errorText}>{error}</Text>}
		</View>
	);
};

export default TimePicker;
