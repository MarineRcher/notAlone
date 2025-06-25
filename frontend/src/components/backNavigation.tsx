import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import ChevronLeft from "../../assets/icons/chevron-left.svg";
import styles from "./backNavigation.style";
import { useNavigation } from "@react-navigation/native";
interface BackButtonProps {
    onPress?: () => void;
}

const BackButton = ({ onPress }: BackButtonProps) => {
    const navigation = useNavigation();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            navigation.goBack();
        }
    };

    return (
        <TouchableOpacity style={styles.backButton} onPress={handlePress}>
            <ChevronLeft width={36} height={36} />
        </TouchableOpacity>
    );
};

export default BackButton;
