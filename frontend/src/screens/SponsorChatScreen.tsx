// Sponsor Chat Screen

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
import sponsorService, { SponsorMessage } from '../api/sponsorService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import sponsorChatStyles from './SponsorChatScreen.style';

const styles = sponsorChatStyles;

interface Message {
	id: string;
	senderId: string;
	senderName: string;
	content: string;
	timestamp: number;
	isOwn: boolean;
}

type Props = NativeStackScreenProps<any, any>;

export default function SponsorChatScreen({ route, navigation }: Props) {
	const { sponsorshipId, otherUserId, otherUserName, isSponsoring } = route.params || {};
	const { user } = useAuth();

	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [connectionStatus, setConnectionStatus] = useState('Loading...');
	const flatListRef = useRef<FlatList>(null);

	useEffect(() => {
		if (user) {
			initializeSponsorChat();
		}
	}, [user]);

	const initializeSponsorChat = async () => {
		try {
			console.log('[SPONSOR-CHAT] Initializing sponsor chat');
			console.log('[SPONSOR-CHAT] User ID:', user!.id);
			console.log('[SPONSOR-CHAT] Sponsorship ID:', sponsorshipId);
			console.log('[SPONSOR-CHAT] Other User ID:', otherUserId);

			setIsLoading(true);
			setConnectionStatus('Loading messages...');

			// Load messages
			await loadMessages();

			setIsLoading(false);
			setConnectionStatus('Connected');

			console.log('[SPONSOR-CHAT] Initialization complete');
		} catch (error) {
			console.error('[SPONSOR-CHAT] Failed to initialize sponsor chat:', error);
			setConnectionStatus('Connection failed');
			Alert.alert('Error', 'Failed to load sponsor chat. Please try again.');
			setIsLoading(false);
		}
	};

	const loadMessages = async () => {
		try {
			const { messages: sponsorMessages } = await sponsorService.getMessages(sponsorshipId);
			
			const formattedMessages: Message[] = sponsorMessages.map(msg => ({
				id: msg.id,
				senderId: msg.senderId,
				senderName: msg.senderId === user!.id ? 'You' : otherUserName,
				content: msg.encryptedContent, // Now contains plain text
				timestamp: new Date(msg.timestamp).getTime(),
				isOwn: msg.senderId === user!.id,
			}));

			setMessages(formattedMessages.sort((a, b) => a.timestamp - b.timestamp));
		} catch (error) {
			console.error('Error loading messages:', error);
		}
	};


	const sendMessage = async () => {
		if (!newMessage.trim()) {
			return;
		}

		try {
			console.log('[SPONSOR-CHAT] Sending message');

			// Send message to backend
			await sponsorService.sendMessage(sponsorshipId, newMessage.trim(), 'text');

			console.log('[SPONSOR-CHAT] Message sent successfully');

			// Add to local messages
			const message: Message = {
				id: Date.now().toString(), // Temporary ID
				senderId: user!.id,
				senderName: 'You',
				content: newMessage.trim(),
				timestamp: Date.now(),
				isOwn: true,
			};

			setMessages(prev => [...prev, message]);
			setNewMessage('');

			// Auto-scroll to bottom
			setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: true });
			}, 100);

			// Reload messages to get the actual message from server
			setTimeout(() => {
				loadMessages();
			}, 500);
		} catch (error: any) {
			console.error('[SPONSOR-CHAT] Failed to send message:', error);
			Alert.alert('Error', 'Failed to send message. Please try again.');
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
					<Text style={styles.statusConnected}>
						{connectionStatus}
					</Text>
				</View>
			</View>

			{isLoading ? (
				<View style={styles.loadingContainer}>
					<Text style={styles.loadingText}>Loading chat...</Text>
					<Text style={styles.statusText}>{connectionStatus}</Text>
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
							placeholder="Type your message..."
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