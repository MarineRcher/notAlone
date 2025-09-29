import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SvgXml } from "react-native-svg";
import styles from "./badgeCard.style";

type Props = {
	svgUrl: string;
	name: string;
	isDisabled?: boolean;
	onPress?: () => void;
	testID?: string;
};

export const BadgeCard: React.FC<Props> = ({
	svgUrl,
	name,
	isDisabled = false,
	onPress,
	testID,
}) => {
	const [svgXml, setSvgXml] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	const fetchSvg = useCallback(async () => {
		try {
			const res = await fetch(svgUrl);
			if (!res.ok) throw new Error("HTTP error");
			const text = await res.text();
			if (!text.startsWith("<svg")) throw new Error("Not SVG");
			setSvgXml(text);
		} catch (e) {
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [svgUrl]);

	useEffect(() => {
		fetchSvg();
	}, [fetchSvg]);

	const Content = () => {
		if (loading) return <ActivityIndicator size="large" color="#666" />;
		if (error) return <Text style={styles.errorIcon}>⚠️</Text>;
		if (svgXml) return <SvgXml xml={svgXml} height={60} width={60} />;
		return <View style={styles.placeholderIcon} />;
	};

	const CardWrapper = onPress ? TouchableOpacity : View;
	return (
		<CardWrapper
			style={[styles.card, isDisabled && styles.cardDisabled]}
			onPress={onPress}
			disabled={isDisabled}
			testID={testID}
			activeOpacity={onPress ? 0.8 : 1}
		>
			<View style={styles.iconContainer}>
				<Content />
			</View>
			<Text
				style={[styles.name, isDisabled && styles.nameDisabled]}
				numberOfLines={2}
				ellipsizeMode="tail"
			>
				{name}
			</Text>
		</CardWrapper>
	);
};
