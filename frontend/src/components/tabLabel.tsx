import React from "react";
import { Text } from "react-native";

type Props = {
	focused: boolean;
	label: string;
	color: string;
};

const TabLabel = ({ focused, label, color }: Props) =>
{
	return (
		<Text
			style={{
				fontFamily: focused ? "quicksand-bold" : "quicksand-regular",
				fontSize: 12,
				color,
			}}
		>
			{label}
		</Text>
	);
};

export default TabLabel;
