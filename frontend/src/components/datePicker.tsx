// components/CustomDatePicker.tsx
import React from "react";
import { TouchableOpacity, Text, View, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import styles from "./input.styles";

interface CustomDatePickerProps {
	value: Date;
	onChange: (date: Date) => void;
	placeholder?: string;
	showPicker: boolean;
	setShowPicker: (show: boolean) => void;
}

const DatePicker: React.FC<CustomDatePickerProps> = ({
	value,
	onChange,
	placeholder = "Sélectionnez une date",
	showPicker,
	setShowPicker,
}) => 
{
	const handleChange = (event, selectedDate) => 
{
		setShowPicker(false);
		if (event.type === "set" && selectedDate) 
{
			onChange(selectedDate);
		}
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity
				onPress={() => setShowPicker(true)}
				style={[styles.baseInput, styles.input]}
			>
				<Text
					style={{
						color: value ? "#000" : "#aaa",
						fontSize: 16,
						fontFamily: "Quicksand-Regular",
					}}
				>
					{value ? value.toLocaleDateString("fr-FR") : placeholder}
				</Text>
			</TouchableOpacity>
			{showPicker && (
				<DateTimePicker
					value={value}
					mode="date"
					display="spinner"
					onChange={handleChange}
					maximumDate={new Date()}
				/>
			)}
		</View>
	);
};

export default DatePicker;
