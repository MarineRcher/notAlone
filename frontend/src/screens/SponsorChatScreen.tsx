// E2E Encrypted Sponsor Chat Screen using Signal Protocol

import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	FlatList,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import styles from './GroupChatScreen.style'; // Reuse group chat styles
import sponsorService, { SponsorMessage } from '../api/sponsorService';
import { SponsorChatProtocol } from '../crypto/sponsor-protocol';

interface Message {
	id: string;
	senderId: string;
	senderName: string;
	content: string;
	timestamp: number;
	isEncrypted: boolean;
	isOwn: boolean;
}

interface SponsorChatScreenProps {
	route: {
		params: {
			sponsorshipId: number;
			otherUserId: string;
			otherUserName: string;
			isSponsoring: boolean;
		};
	};
	navigation: any;
}

export default function SponsorChatScreen({ route, navigation }: SponsorChatScreenProps) {
	const { sponsorshipId, otherUserId, otherUserName, isSponsoring } = route.params;
	const { user } = useAuth();

	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [isInitialized, setIsInitialized] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [keyExchangeComplete, setKeyExchangeComplete] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState('Initializing...');
	const flatListRef = useRef<FlatList>(null);

	useEffect(() => {
		if (user) {
			initializeSponsorChat();
		}
	}, [user]);

	const initializeSponsorChat = async () => {
		try {
			console.log('🔑 [SPONSOR-CHAT] ===== INITIALIZING SPONSOR CHAT =====');
			console.log('🔑 [SPONSOR-CHAT] User ID:', user!.id);
			console.log('🔑 [SPONSOR-CHAT] Sponsorship ID:', sponsorshipId);
			console.log('🔑 [SPONSOR-CHAT] Other User ID:', otherUserId);

			setIsLoading(true);
			setConnectionStatus('Initializing encryption...');

			// Initialize sponsor chat protocol
			await SponsorChatProtocol.initialize();

			// Load existing session or create new one
			await SponsorChatProtocol.loadSession(sponsorshipId);
			await SponsorChatProtocol.createSession(sponsorshipId, user!.id, otherUserId);

			// Load messages and sponsorship info
			await loadMessages();
			await checkKeyExchange();

			setIsInitialized(true);
			setIsLoading(false);
			setConnectionStatus('Connected - Sponsor Chat Active');

			console.log('🔑 [SPONSOR-CHAT] ===== INITIALIZATION COMPLETE =====');
		} catch (error) {
			console.error('🔑 [SPONSOR-CHAT] ❌ Failed to initialize sponsor chat:', error);
			setConnectionStatus('Connection failed');
			Alert.alert('Error', 'Failed to initialize secure sponsor chat. Please try again.');
			setIsLoading(false);
		}
	};

	const loadMessages = async () => {
		try {
			const { messages: sponsorMessages } = await sponsorService.getMessages(sponsorshipId);
			
			const decryptedMessages: Message[] = [];
			
			for (const msg of sponsorMessages) {
				try {
					if (msg.messageType === 'text') {
						// Decrypt the message
						const encryptedMessage = JSON.parse(msg.encryptedContent);
						const decryptedContent = await SponsorChatProtocol.decryptMessage(sponsorshipId, encryptedMessage);
						
						decryptedMessages.push({
							id: msg.id,
							senderId: msg.senderId,
							senderName: msg.senderId === user!.id ? 'You' : otherUserName,
							content: decryptedContent,
							timestamp: new Date(msg.timestamp).getTime(),
							isEncrypted: true,
							isOwn: msg.senderId === user!.id,
						});
					} else {
						// System message or key exchange
						decryptedMessages.push({
							id: msg.id,
							senderId: msg.senderId,
							senderName: 'System',
							content: msg.messageType === 'key_exchange' ? '🔑 Key exchange in progress...' : msg.encryptedContent,
							timestamp: new Date(msg.timestamp).getTime(),
							isEncrypted: false,
							isOwn: false,
						});
					}
				} catch (error) {
					console.error('Failed to decrypt message:', msg.id, error);
					// Add as undecryptable message
					decryptedMessages.push({
						id: msg.id,
						senderId: msg.senderId,
						senderName: msg.senderId === user!.id ? 'You' : otherUserName,
						content: '🔒 Message could not be decrypted',
						timestamp: new Date(msg.timestamp).getTime(),
						isEncrypted: false,
						isOwn: msg.senderId === user!.id,
					});
				}
			}

			setMessages(decryptedMessages.sort((a, b) => a.timestamp - b.timestamp));
		} catch (error) {
			console.error('Error loading messages:', error);
		}
	};

	const checkKeyExchange = async () => {
		try {
			const info = await sponsorService.getSponsorshipInfo();
			const sponsorship = info.hasSponsor ? info.sponsorship : 
				info.sponsoredUsers.find(s => s.id === sponsorshipId);
			
			if (sponsorship?.keyExchangeComplete) {
				setKeyExchangeComplete(true);
				setConnectionStatus('Key exchange complete - Ready to chat');
				
				// Set the other party's public key if we have it
				const otherPublicKey = isSponsoring ? sponsorship.userPublicKey : sponsorship.sponsorPublicKey;
				if (otherPublicKey) {
					const publicKeyBytes = new Uint8Array(JSON.parse(otherPublicKey));
					await SponsorChatProtocol.setOtherPublicKey(sponsorshipId, publicKeyBytes);
				}
			} else {
				setKeyExchangeComplete(false);
				setConnectionStatus('Waiting for key exchange...');
				await performKeyExchange();
			}
		} catch (error) {
			console.error('Error checking key exchange:', error);
		}
	};

	const performKeyExchange = async () => {
		try {
			// Get our public key
			const myPublicKey = SponsorChatProtocol.getMyPublicKey(sponsorshipId);
			if (!myPublicKey) {
				throw new Error('Failed to get public key');
			}

			// Send our public key to the backend
			const publicKeyString = JSON.stringify(Array.from(myPublicKey));
			await sponsorService.updatePublicKey(sponsorshipId, publicKeyString);

			console.log('🔑 [SPONSOR-CHAT] Public key shared successfully');
			
			// Check if key exchange is now complete
			setTimeout(checkKeyExchange, 1000);
		} catch (error) {
			console.error('🔑 [SPONSOR-CHAT] Failed to perform key exchange:', error);
			Alert.alert('Error', 'Failed to complete key exchange. Please try again.');
		}
	};

	const sendMessage = async () => {
		if (!newMessage.trim() || !isInitialized || !keyExchangeComplete) {
			return;
		}

		try {
			console.log('📤 [SPONSOR-CHAT] ===== SENDING ENCRYPTED MESSAGE =====');
			console.log('📤 [SPONSOR-CHAT] Message length:', newMessage.trim().length);

			// Encrypt message using sponsor chat protocol
			const encryptedMessage = await SponsorChatProtocol.encryptMessage(sponsorshipId, newMessage.trim());

			console.log('✅ [SPONSOR-CHAT] Message encrypted successfully');

			// Send encrypted message to backend
			const encryptedContent = JSON.stringify(encryptedMessage);
			await sponsorService.sendMessage(sponsorshipId, encryptedContent, 'text');

			console.log('✅ [SPONSOR-CHAT] Encrypted message sent to server');

			// Add to local messages
			const message: Message = {
				id: encryptedMessage.messageId,
				senderId: user!.id,
				senderName: 'You',
				content: newMessage.trim(),
				timestamp: encryptedMessage.timestamp,
				isEncrypted: true,
				isOwn: true,
			};

			setMessages(prev => [...prev, message]);
			setNewMessage('');

			// Auto-scroll to bottom
			setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: true });
			}, 100);
		} catch (error: any) {
			console.error('❌ [SPONSOR-CHAT] Failed to send message:', error);
			Alert.alert('Error', 'Failed to send encrypted message. Please try again.');
		}
	};

	const renderMessage = ({ item }: { item: Message }) => (
		<View style={[
			styles.messageContainer,
			item.isOwn ? styles.ownMessage : styles.otherMessage
		]}>
			<View style={[
				styles.messageBubble,
				item.isOwn ? styles.ownBubble : styles.otherBubble
			]}>
				{!item.isOwn && (
					<Text style={styles.senderName}>{item.senderName}</Text>
				)}
				<Text style={[
					styles.messageText,
					item.isOwn ? styles.ownMessageText : styles.otherMessageText
				]}>
					{item.content}
				</Text>
				<Text style={[
					styles.messageTime,
					item.isOwn ? styles.ownMessageTime : styles.otherMessageTime
				]}>
					{new Date(item.timestamp).toLocaleTimeString([], { 
						hour: '2-digit', 
						minute: '2-digit' 
					})}
					{item.isEncrypted && ' 🔒'}
				</Text>
			</View>
		</View>
	);

	return (
		<KeyboardAvoidingView 
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backButton}>← Back</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>
					{otherUserName} {isSponsoring ? '(Filleul)' : '(Parrain)'}
				</Text>
				<View style={styles.headerRight}>
					<Text style={[
						styles.statusText,
						keyExchangeComplete ? styles.statusConnected : styles.statusConnecting
					]}>
						{keyExchangeComplete ? '🔒 Secured' : '🔄 Connecting'}
					</Text>
				</View>
			</View>

			{isLoading ? (
				<View style={styles.loadingContainer}>
					<Text style={styles.loadingText}>Initializing secure chat...</Text>
					<Text style={styles.statusText}>{connectionStatus}</Text>
				</View>
			) : !keyExchangeComplete ? (
				<View style={styles.loadingContainer}>
					<Text style={styles.loadingText}>Setting up encryption...</Text>
					<Text style={styles.statusText}>Waiting for key exchange to complete</Text>
					<TouchableOpacity style={styles.retryButton} onPress={performKeyExchange}>
						<Text style={styles.retryButtonText}>Retry Key Exchange</Text>
					</TouchableOpacity>
				</View>
			) : (
				<>
					<FlatList
						ref={flatListRef}
						data={messages}
						keyExtractor={(item) => item.id}
						renderItem={renderMessage}
						style={styles.messagesList}
						onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
					/>

					<View style={styles.inputContainer}>
						<TextInput
							style={styles.messageInput}
							value={newMessage}
							onChangeText={setNewMessage}
							placeholder="Type your encrypted message..."
							placeholderTextColor="#666"
							multiline
							maxLength={1000}
						/>
						<TouchableOpacity
							style={[
								styles.sendButton,
								!newMessage.trim() && styles.sendButtonDisabled
							]}
							onPress={sendMessage}
							disabled={!newMessage.trim()}
						>
							<Text style={styles.sendButtonText}>Send</Text>
						</TouchableOpacity>
					</View>
				</>
			)}
		</KeyboardAvoidingView>
	);
} 