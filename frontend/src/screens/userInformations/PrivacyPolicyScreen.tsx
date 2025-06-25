import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useContext } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";

type Props = NativeStackScreenProps<any, any>;
const PrivacyPolicycreen = ({ navigation }: Props) => {
    return (
        <View>
            <Text>Politique de confidentialité</Text>
        </View>
    );
};

export default PrivacyPolicycreen;
