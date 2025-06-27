import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Clipboard } from 'react-native';
import sponsorService, { SponsorshipInfo, PendingRequests } from '../api/sponsorService';
import { SponsorChatProtocol } from '../crypto/sponsor-protocol';
import Input from './input';
import Button from './button';
import { StyleSheet } from 'react-native';
import colors from '../css/colors';

interface SponsorSectionProps {
	navigation: any;
}

const SponsorSection: React.FC<SponsorSectionProps> = ({ navigation }) => {
	const [sponsorshipInfo, setSponsorshipInfo] = useState<SponsorshipInfo | null>(null);
	const [pendingRequests, setPendingRequests] = useState<PendingRequests | null>(null);
	const [sponsorCode, setSponsorCode] = useState('');
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		loadSponsorshipInfo();
		loadPendingRequests();
	}, []);

	const loadSponsorshipInfo = async () => {
		try {
			setRefreshing(true);
			const info = await sponsorService.getSponsorshipInfo();
			setSponsorshipInfo(info);
		} catch (error) {
			console.error('Error loading sponsorship info:', error);
			Alert.alert('Erreur', 'Impossible de charger les informations de parrainage');
		} finally {
			setRefreshing(false);
		}
	};

	const loadPendingRequests = async () => {
		try {
			const requests = await sponsorService.getPendingSponsorRequests();
			setPendingRequests(requests);
		} catch (error) {
			console.error('Error loading pending requests:', error);
		}
	};

	const copySponsorCode = () => {
		if (sponsorshipInfo?.sponsorCode) {
			Clipboard.setString(sponsorshipInfo.sponsorCode);
			Alert.alert('Copié', 'Code de parrainage copié dans le presse-papiers');
		}
	};

	const requestSponsor = async () => {
		if (!sponsorCode.trim() || sponsorCode.length !== 8) {
			Alert.alert('Erreur', 'Veuillez entrer un code de parrainage valide (8 chiffres)');
			return;
		}

		try {
			setLoading(true);
			
			// Initialize the sponsor chat protocol
			await SponsorChatProtocol.initialize();
			
			// Create a temporary session to get public key
			const tempSessionId = Math.floor(Math.random() * 1000000);
			await SponsorChatProtocol.createSession(tempSessionId, 'temp-user', 'temp-sponsor');
			const userPublicKey = SponsorChatProtocol.getMyPublicKey(tempSessionId);
			
			if (!userPublicKey) {
				throw new Error('Failed to generate public key');
			}

			const publicKeyString = Array.from(userPublicKey).join(',');
			
			const result = await sponsorService.requestSponsor(sponsorCode, publicKeyString);
			
			Alert.alert('Succès', result.message);
			setSponsorCode('');
			loadSponsorshipInfo();
			loadPendingRequests();
		} catch (error: any) {
			Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'envoyer la demande de parrainage');
		} finally {
			setLoading(false);
		}
	};

	const respondToRequest = async (sponsorshipId: number, action: 'accept' | 'reject') => {
		try {
			setLoading(true);

			let sponsorPublicKey: string | undefined;
			if (action === 'accept') {
				// Initialize the sponsor chat protocol
				await SponsorChatProtocol.initialize();
				
				// Create a session to get public key
				const tempSessionId = Math.floor(Math.random() * 1000000);
				await SponsorChatProtocol.createSession(tempSessionId, 'temp-sponsor', 'temp-user');
				const publicKey = SponsorChatProtocol.getMyPublicKey(tempSessionId);
				
				if (!publicKey) {
					throw new Error('Failed to generate public key');
				}
				
				sponsorPublicKey = Array.from(publicKey).join(',');
			}

			const result = await sponsorService.respondToSponsorRequest(sponsorshipId, action, sponsorPublicKey);
			
			Alert.alert('Succès', result.message);
			loadSponsorshipInfo();
			loadPendingRequests();
		} catch (error: any) {
			Alert.alert('Erreur', error.response?.data?.message || 'Impossible de répondre à la demande');
		} finally {
			setLoading(false);
		}
	};

	const removeSponsor = (sponsorshipId: number, isSponsored: boolean) => {
		const title = isSponsored ? 'Supprimer le parrain' : 'Supprimer le filleul';
		const message = isSponsored 
			? 'Êtes-vous sûr de vouloir supprimer votre parrain ?' 
			: 'Êtes-vous sûr de vouloir supprimer ce filleul ?';

		Alert.alert(title, message, [
			{ text: 'Annuler', style: 'cancel' },
			{
				text: 'Supprimer',
				style: 'destructive',
				onPress: async () => {
					try {
						setLoading(true);
						const result = await sponsorService.removeSponsor(sponsorshipId);
						Alert.alert('Succès', result.message);
						loadSponsorshipInfo();
					} catch (error: any) {
						Alert.alert('Erreur', error.response?.data?.message || 'Impossible de supprimer le parrainage');
					} finally {
						setLoading(false);
					}
				},
			},
		]);
	};

	if (refreshing) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Parrainage</Text>

			{/* Sponsor Code Section */}
			{sponsorshipInfo?.sponsorCode && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Mon code de parrainage</Text>
					<TouchableOpacity style={styles.codeContainer} onPress={copySponsorCode}>
						<Text style={styles.sponsorCode}>{sponsorshipInfo.sponsorCode}</Text>
						<Text style={styles.copyHint}>Appuyez pour copier</Text>
					</TouchableOpacity>
				</View>
			)}

			{/* Current Sponsor Section */}
			{sponsorshipInfo?.hasSponsor ? (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Mon parrain</Text>
					<View style={styles.sponsorInfo}>
						<Text style={styles.sponsorName}>{sponsorshipInfo.sponsorship?.sponsor?.login}</Text>
						<Text style={styles.sponsorEmail}>{sponsorshipInfo.sponsorship?.sponsor?.email}</Text>
						<View style={styles.buttonRow}>
							<TouchableOpacity
								style={styles.chatButton}
								onPress={() => navigation.navigate('SponsorChat', { 
									sponsorshipId: sponsorshipInfo.sponsorship?.id,
									otherUserName: sponsorshipInfo.sponsorship?.sponsor?.login 
								})}
							>
								<Text style={styles.chatButtonText}>Chat</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.removeButton}
								onPress={() => removeSponsor(sponsorshipInfo.sponsorship!.id, true)}
							>
								<Text style={styles.removeButtonText}>Supprimer</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			) : (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Demander un parrain</Text>
					<Input
						placeholder="Code de parrainage (8 chiffres)"
						value={sponsorCode}
						onChangeText={setSponsorCode}
						keyboardType="numeric"
						maxLength={8}
					/>
					<Button
						title="Demander un parrainage"
						onPress={requestSponsor}
						disabled={loading || sponsorCode.length !== 8}
					/>
				</View>
			)}

			{/* Outgoing Request */}
			{pendingRequests?.outgoingRequest && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Demande en attente</Text>
					<Text style={styles.pendingText}>
						Demande envoyée à {pendingRequests.outgoingRequest.sponsor?.login}
					</Text>
				</View>
			)}

			{/* Sponsored Users Section */}
			{sponsorshipInfo?.isSponsoring && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Mes filleuls</Text>
					{sponsorshipInfo.sponsoredUsers.map((sponsored) => (
						<View key={sponsored.id} style={styles.sponsorInfo}>
							<Text style={styles.sponsorName}>{sponsored.user?.login}</Text>
							<Text style={styles.sponsorEmail}>{sponsored.user?.email}</Text>
							<View style={styles.buttonRow}>
								<TouchableOpacity
									style={styles.chatButton}
									onPress={() => navigation.navigate('SponsorChat', { 
										sponsorshipId: sponsored.id,
										otherUserName: sponsored.user?.login 
									})}
								>
									<Text style={styles.chatButtonText}>Chat</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.removeButton}
									onPress={() => removeSponsor(sponsored.id, false)}
								>
									<Text style={styles.removeButtonText}>Supprimer</Text>
								</TouchableOpacity>
							</View>
						</View>
					))}
				</View>
			)}

			{/* Pending Requests Section */}
			{pendingRequests?.incomingRequests && pendingRequests.incomingRequests.length > 0 && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Demandes reçues</Text>
					{pendingRequests.incomingRequests.map((request) => (
						<View key={request.id} style={styles.requestItem}>
							<Text style={styles.requesterName}>{request.user?.login}</Text>
							<Text style={styles.requesterEmail}>{request.user?.email}</Text>
							<View style={styles.buttonRow}>
								<TouchableOpacity
									style={styles.acceptButton}
									onPress={() => respondToRequest(request.id, 'accept')}
									disabled={loading}
								>
									<Text style={styles.acceptButtonText}>Accepter</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.rejectButton}
									onPress={() => respondToRequest(request.id, 'reject')}
									disabled={loading}
								>
									<Text style={styles.rejectButtonText}>Refuser</Text>
								</TouchableOpacity>
							</View>
						</View>
					))}
				</View>
			)}

			{loading && (
				<View style={styles.overlay}>
					<ActivityIndicator size="large" color={colors.primary} />
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		color: colors.text,
		textAlign: 'center',
	},
	section: {
		marginBottom: 25,
		padding: 15,
		backgroundColor: colors.surface,
		borderRadius: 10,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 15,
		color: colors.text,
	},
	codeContainer: {
		backgroundColor: colors.primary,
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
	},
	sponsorCode: {
		fontSize: 24,
		fontWeight: 'bold',
		color: 'white',
		letterSpacing: 2,
	},
	copyHint: {
		fontSize: 12,
		color: 'rgba(255, 255, 255, 0.8)',
		marginTop: 5,
	},
	sponsorInfo: {
		padding: 15,
		backgroundColor: colors.background,
		borderRadius: 8,
	},
	sponsorName: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.text,
	},
	sponsorEmail: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 10,
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 10,
	},
	chatButton: {
		backgroundColor: colors.primary,
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 5,
		flex: 1,
		marginRight: 10,
	},
	chatButtonText: {
		color: 'white',
		fontWeight: '600',
		textAlign: 'center',
	},
	removeButton: {
		backgroundColor: colors.error,
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 5,
		flex: 1,
	},
	removeButtonText: {
		color: 'white',
		fontWeight: '600',
		textAlign: 'center',
	},
	pendingText: {
		fontSize: 14,
		color: colors.textSecondary,
		fontStyle: 'italic',
	},
	requestItem: {
		padding: 15,
		backgroundColor: colors.background,
		borderRadius: 8,
		marginBottom: 10,
	},
	requesterName: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.text,
	},
	requesterEmail: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 10,
	},
	acceptButton: {
		backgroundColor: colors.success,
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 5,
		flex: 1,
		marginRight: 10,
	},
	acceptButtonText: {
		color: 'white',
		fontWeight: '600',
		textAlign: 'center',
	},
	rejectButton: {
		backgroundColor: colors.error,
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 5,
		flex: 1,
	},
	rejectButtonText: {
		color: 'white',
		fontWeight: '600',
		textAlign: 'center',
	},
	overlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default SponsorSection; 