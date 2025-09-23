import React, { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SvgXml } from "react-native-svg";
import styles from "./badgeCard.style";

type Props = {
	svgUrl: string;
	description: string;
	isDisabled?: boolean;
	onPress?: () => void;
	testID?: string;
};

export const BadgeCard: React.FC<Props> = ({
	svgUrl,
	description,
	isDisabled = false,
	onPress,
	testID,
}) => {
	const [svgXml, setSvgXml] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [hasError, setHasError] = useState<boolean>(false);

	const fetchSvg = useCallback(async () => {
		if (!svgUrl) return;

		setIsLoading(true);
		setHasError(false);

		try {
			const res = await fetch(svgUrl);
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`);
			}

			const text = await res.text();
			if (!text.trim().startsWith("<svg")) {
				throw new Error("Le contenu récupéré n'est pas un SVG valide.");
			}

			setSvgXml(text);
		} catch (err: any) {
			console.error("Erreur lors du téléchargement du SVG:", err?.message);
			setHasError(true);
		} finally {
			setIsLoading(false);
		}
	}, [svgUrl]);

	useEffect(() => {
		fetchSvg();
	}, [fetchSvg]);

	const handlePress = useCallback(() => {
		if (!isDisabled && onPress) {
			onPress();
		}
	}, [isDisabled, onPress]);

	const renderContent = () => {
		if (isLoading) {
			return (
				<View style={styles.iconContainer}>
					<ActivityIndicator size="large" color="#666" />
				</View>
			);
		}

		if (hasError) {
			return (
				<View style={styles.iconContainer}>
					<Text style={styles.errorIcon}>⚠️</Text>
				</View>
			);
		}

		if (svgXml) {
			return (
				<View style={styles.iconContainer}>
					<SvgXml xml={svgXml} height={60} width={60} />
				</View>
			);
		}

		return (
			<View style={styles.iconContainer}>
				<View style={styles.placeholderIcon} />
			</View>
		);
	};

	const cardStyle = [styles.card, isDisabled && styles.cardDisabled];

	const textStyle = [
		styles.description,
		isDisabled && styles.descriptionDisabled,
	];

	if (onPress) {
		return (
			<TouchableOpacity
				style={cardStyle}
				onPress={handlePress}
				disabled={isDisabled}
				testID={testID}
				activeOpacity={0.8}
			>
				{renderContent()}
				<Text style={textStyle} numberOfLines={2}>
					{description}
				</Text>
			</TouchableOpacity>
		);
	}

	return (
		<View style={cardStyle} testID={testID}>
			{renderContent()}
			<Text style={textStyle} numberOfLines={2}>
				{description}
			</Text>
		</View>
	);
};
