// Sponsored Users List Screen - for sponsors to choose who to chat with

import React from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	FlatList,
	Alert,
} from 'react-native';
import styles from './HomeScreen.style'; // Reuse home screen styles
import User from '../../assets/icons/menu/user.svg';
import colors from '../css/colors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

interface SponsoredUser {
	id: number;
	sponsorId: string;
	userId: string;
	status: 'pending' | 'accepted' | 'rejected';
	user?: {
		id: string;
		login: string;
		email: string;
	};
}

type Props = NativeStackScreenProps<any, any>;

export default function SponsoredUsersList({ route, navigation }: Props) {
	const { sponsoredUsers } = route.params || {};

	const handleSelectUser = (sponsoredUser: SponsoredUser) => {
		if (!sponsoredUser.user) {
			Alert.alert('Error', 'User information not available');
			return;
		}

		navigation.navigate("SponsorChat", {
			sponsorshipId: sponsoredUser.id,
			otherUserId: sponsoredUser.userId,
			otherUserName: sponsoredUser.user.login,
			isSponsoring: true,
		});
	};

	const renderSponsoredUser = ({ item }: { item: SponsoredUser }) => (
		<TouchableOpacity
			style={styles.user}
			onPress={() => handleSelectUser(item)}
		>
			<User 
				width={36} 
				height={36} 
				fill={colors.primary} 
			/>
			<Text style={styles.squaresText}>
				{item.user?.login || 'Unknown User'}
			</Text>
			<Text style={[
				styles.squaresText,
				{ fontSize: 12, marginTop: 5 }
			]}>
				Ready to chat
			</Text>
		</TouchableOpacity>
	);

	return (
		<View style={styles.scrollContainer}>
			<View style={styles.container}>
				<Text style={styles.squaresText}>Choisissez un filleul à qui parler</Text>
			</View>

			{sponsoredUsers.length === 0 ? (
				<View style={styles.container}>
					<Text style={styles.squaresText}>Vous n'avez pas encore de filleuls à parrainer.</Text>
				</View>
			) : (
				<FlatList
					data={sponsoredUsers}
					keyExtractor={(item) => item.id.toString()}
					renderItem={renderSponsoredUser}
					contentContainerStyle={{ gap: 15, padding: 20 }}
				/>
			)}

			<TouchableOpacity
				style={[styles.user, { marginTop: 20 }]}
				onPress={() => navigation.goBack()}
			>
				<Text style={styles.squaresText}>← Retour</Text>
			</TouchableOpacity>
		</View>
	);
} 