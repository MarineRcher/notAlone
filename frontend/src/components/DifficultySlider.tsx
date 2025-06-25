import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import styles from "./DifficultySlider.style";
import colors from "../css/colors";

const mascotImages = {
	angry: require("../../assets/mascot/angry.png"),
	happy: require("../../assets/mascot/happy.png"),
	woaw: require("../../assets/mascot/woaw.png"),
};

const difficultyStates = [
	{ label: "Super", value: "Facile", mascot: "woaw" },
	{ label: "Ca va", value: "Moyen", mascot: "happy" },
	{ label: "Mal", value: "Dur", mascot: "angry" },
];

export default function DifficultySlider({
	onSelect,
	initialValue = "Moyen",
}: {
    onSelect: (value: string) => void;
    initialValue?: string;
})
{
	const initialIndex = difficultyStates.findIndex(
		(d) => d.value === initialValue
	);
	const [index, setIndex] = useState(initialIndex !== -1 ? initialIndex : 1);

	useEffect(() =>
	{
		onSelect(difficultyStates[index].value);
	}, [index]);

	const currentState = difficultyStates[index];

	return (
		<View style={styles.container}>
			<Image
				source={
					mascotImages[
                        currentState.mascot as keyof typeof mascotImages
					]
				}
				style={styles.image}
				resizeMode="contain"
			/>

			<Slider
				style={{ width: 280, height: 40 }}
				minimumValue={0}
				maximumValue={2}
				step={1}
				value={index}
				minimumTrackTintColor={colors.primary}
				maximumTrackTintColor="#e0e0e0"
				thumbTintColor={colors.primary}
				onValueChange={(val) => setIndex(val)}
			/>

			<View style={styles.labels}>
				{difficultyStates.map((d, i) => (
					<Text
						key={d.value}
						style={[
							styles.label,
							i === index && styles.selectedLabel,
						]}
					>
						{d.label}
					</Text>
				))}
			</View>
		</View>
	);
}
