import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useContext } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";

type Props = NativeStackScreenProps<any, any>;
const SupportScreen = ({ navigation }: Props) =>
{
	return (
		<View>
			<Text>Support</Text>
		</View>
	);
};

export default SupportScreen;
