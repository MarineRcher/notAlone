import React from "react";
import { Text, View } from "react-native";
import styles from "./feature.style";
import CheckCircle from "../../assets/icons/check-circle.svg";

type FeatureProps = {
    feature: string;
};

const Feature: React.FC<FeatureProps> = ({ feature }) => {
    return (
        <View style={styles.featureContainer}>
            <View style={styles.feature}>
                <CheckCircle width={36} height={36} />
            </View>
            <Text style={styles.text}>{feature}</Text>
        </View>
    );
};

export default Feature;
