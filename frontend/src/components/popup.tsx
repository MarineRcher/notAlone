import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import styles from "./popup.style";

export default function Popup({
	visible,
	onClose,
	message,
}: {
	visible: boolean;
	onClose: () => void;
	message: string;
}) {
	return (
		<Modal transparent visible={visible} animationType="fade">
			<BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
			<View style={styles.centered}>
				<View style={styles.modalView}>
					<Text style={styles.title}>Accès limité</Text>
					<Text style={styles.message}>{message}</Text>
					<TouchableOpacity onPress={onClose} style={styles.button}>
						<Text style={styles.buttonText}>OK</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
}
