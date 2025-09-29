// E2E Encrypted Group Chat Screen using Signal Protocol (@signalapp/libsignal-client)

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
	ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import styles from './GroupChatScreen.style';
import io, { Socket } from 'socket.io-client';
import { apiConfig } from '../config/api';
import { CryptoAPI } from '../crypto';

interface Message {
	id: string;
  senderId: string;
  senderName: string;
	content: string;
  timestamp: number;
  isEncrypted: boolean;
  isOwn: boolean;
}

interface GroupMember {
	userId: string;
	username: string;
	isOnline: boolean;
}

interface GroupChatScreenProps {
  route?: {
    params?: {
      groupId?: string;
      groupName?: string;
    };
  };
  navigation: any;
}

export default function GroupChatScreen({ route, navigation }: GroupChatScreenProps)
{
	// Provide default values to handle undefined route params
	const groupId = route?.params?.groupId || 'default-group';
	const groupName = route?.params?.groupName || 'LibSignal Group Chat';
	const { user } = useAuth();

	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [members, setMembers] = useState<GroupMember[]>([]);
	const [isInitialized, setIsInitialized] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isWaitingForKeys, setIsWaitingForKeys] = useState(true);
	const [connectionStatus, setConnectionStatus] = useState('Connecting...');
	const [keyExchangeStatus, setKeyExchangeStatus] = useState('Initializing encryption...');
	const [pendingMessages, setPendingMessages] = useState<Map<string, any>>(new Map());
	const [keyExchangeComplete, setKeyExchangeComplete] = useState<Set<string>>(new Set());
	// Key retry mechanism states
	const [keyRequestAttempts, setKeyRequestAttempts] = useState<Map<string, number>>(new Map());
	const [keyRequestTimeouts, setKeyRequestTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());
	const [missingKeysAlert, setMissingKeysAlert] = useState<Set<string>>(new Set());
	const socketRef = useRef<Socket | null>(null);
	const flatListRef = useRef<FlatList>(null);
	
	// Constants for retry mechanism
	const KEY_REQUEST_CONFIG = {
		MAX_ATTEMPTS: 5,
		INITIAL_DELAY: 2000,      // 2 seconds
		MAX_DELAY: 30000,         // 30 seconds
		RETRY_DELAYS: [0, 2000, 4000, 8000, 16000, 30000], // Exponential backoff
	};

	useEffect(() =>
	{
		if (user)
		{
			initializeGroupChat();
		}
		return () =>
		{
			if (socketRef.current)
			{
				socketRef.current.disconnect();
			}
			// Clear all key request timeouts
			keyRequestTimeouts.forEach(timeout => clearTimeout(timeout));
		};
	}, [user]);

	// Clean up old pending messages (older than 5 minutes)
	useEffect(() =>
	{
		const cleanup = setInterval(() =>
		{
			const now = Date.now();

			setPendingMessages(prev =>
			{
				const newMap = new Map(prev);
				let removed = 0;

				newMap.forEach((messageData, pendingId) =>
				{
					if (now - messageData.timestamp > 5 * 60 * 1000)
					{ // 5 minutes
						newMap.delete(pendingId);
						removed++;
					}
				});

				if (removed > 0)
				{
					console.log(`🧹 Cleaned up ${removed} old pending messages`);
				}

				return newMap;
			});
		}, 60000); // Check every minute

		return () => clearInterval(cleanup);
	}, []);

	const checkKeyExchangeStatus = (currentMembers: GroupMember[]) => {
		const otherMembers = currentMembers.filter(m => m.userId !== user!.id.toString());
		const requiredKeys = otherMembers.length;
		const completedKeys = keyExchangeComplete.size;

		console.log(`🔑 [KEY-EXCHANGE] Progress: ${completedKeys}/${requiredKeys} keys exchanged`);
		
		if (requiredKeys === 0) {
			// Solo in group, no key exchange needed
			setIsWaitingForKeys(false);
			setKeyExchangeStatus('Ready to chat');
		} else if (completedKeys >= requiredKeys) {
			// All keys exchanged
			setIsWaitingForKeys(false);
			setKeyExchangeStatus('All keys exchanged - Ready to chat');
		} else {
			// Still waiting for keys
			setIsWaitingForKeys(true);
			setKeyExchangeStatus(`Exchanging keys... (${completedKeys}/${requiredKeys})`);
		}
	};

	const initializeGroupChat = async () =>
	{
		try
		{
			console.log('🔑 [LIBSIGNAL] ===== INITIALIZING GROUP CHAT =====');
			console.log('🔑 [LIBSIGNAL] User ID:', user!.id.toString());
			console.log('🔑 [LIBSIGNAL] Group ID:', groupId);

			setIsLoading(true);
			setConnectionStatus('Initializing libsignal encryption...');

			// Use libsignal-client for real E2EE
			console.log('🔐 Using @signalapp/libsignal-client (official Signal Protocol)...');
			console.log('🔑 [LIBSIGNAL] Initializing crypto API...');
			await CryptoAPI.initialize();
			console.log('🔑 [LIBSIGNAL] ✅ Crypto API initialized');

			// Create or join group session
			try
			{
				console.log('🔑 [LIBSIGNAL] Creating/joining group session...');
				await CryptoAPI.createGroup(groupId, user!.id.toString());
				console.log('🔑 [LIBSIGNAL] ✅ Group session ready');
			}
			catch (error: any)
			{
				console.log('🔑 [LIBSIGNAL] ✅ Using existing group session');
			}

			setConnectionStatus('Connecting to server...');

			// Initialize socket connection
			console.log('🔑 [LIBSIGNAL] Initializing socket connection...');
			await initializeSocket();
			console.log('🔑 [LIBSIGNAL] ✅ Socket connection established');

					setIsInitialized(true);
		setIsLoading(false);
		setConnectionStatus('Connected - Signal Protocol Active');
		setKeyExchangeStatus('Waiting for all members to join...');
		console.log('🔑 [LIBSIGNAL] ===== GROUP CHAT INITIALIZATION COMPLETE =====');
		}
		catch (error: any)
		{
			console.error('🔑 [LIBSIGNAL] ❌ Failed to initialize group chat:', error);
			
			// Provide detailed error message to user
			let errorMessage = 'Failed to initialize secure group chat.';
			let errorDetails = error.message || 'Unknown error';
			
			if (error.message?.includes('Authentication required')) {
				errorMessage = 'Authentication required';
				errorDetails = 'Please login again to access the chat.';
			} else if (error.message?.includes('backend may be offline')) {
				errorMessage = 'Cannot connect to server';
				errorDetails = `Make sure the backend is running at ${apiConfig.socketURL}`;
			} else if (error.message?.includes('ECONNREFUSED')) {
				errorMessage = 'Server connection refused';
				errorDetails = 'The backend server may not be running. Please check server status.';
			} else if (error.message?.includes('timeout')) {
				errorMessage = 'Connection timeout';
				errorDetails = 'The server took too long to respond. Please check your network connection.';
			}
			
			setConnectionStatus('Connection failed');
			Alert.alert(
				errorMessage, 
				errorDetails,
				[
					{
						text: 'Retry',
						onPress: () => initializeGroupChat()
					},
					{
						text: 'Cancel',
						style: 'cancel',
						onPress: () => navigation.goBack()
					}
				]
			);
			setIsLoading(false);
		}
	};

	const initializeSocket = async (): Promise<void> =>
	{
		return new Promise(async (resolve, reject) =>
		{
			// Get the real JWT token from secure storage
			const { getValidToken } = await import('../api/authHelpers').then(m => m.authHelpers);
			const token = await getValidToken();
			
			if (!token) {
				console.error('❌ No valid JWT token available');
				reject(new Error('Authentication required'));
				return;
			}
			
			console.log('🔑 Using authenticated token for socket connection');
			
			// Ensure the URL has the protocol
			const socketUrl = apiConfig.socketURL.startsWith('http') 
				? apiConfig.socketURL 
				: `http://${apiConfig.socketURL}`;
			
			console.log('📡 Connecting to:', socketUrl);
			console.log('   Raw config URL:', apiConfig.socketURL);
			console.log('   Final URL:', socketUrl);
			
			const socket = io(socketUrl, {
				auth: {
					token: token,
				},
				transports: ['polling', 'websocket'], // Start with polling for better compatibility
				reconnection: true,
				reconnectionAttempts: 5,
				reconnectionDelay: 1000,
				timeout: 20000, // Increase timeout to 20 seconds
				upgrade: true, // Allow upgrading from polling to websocket
			});

			socketRef.current = socket;

			socket.on('connect', () =>
			{
				console.log('✅ Socket connected:', socket.id);
				socket.emit('join_group', { groupId });
				resolve();
			});

			socket.on('disconnect', () =>
			{
				console.log('❌ Socket disconnected');
				setConnectionStatus('Disconnected');
			});

			socket.on('connect_error', (error: any) =>
			{
				console.error('❌ Socket connection error:', error);
				console.error('Error type:', error.type || 'unknown');
				console.error('Error message:', error.message);
				console.error('Socket URL:', apiConfig.socketURL);
				console.error('Transport:', socket.io.engine?.transport?.name || 'unknown');
				
				// More detailed error message
				let errorMsg = 'Connection error';
				if (error.message.includes('websocket')) {
					errorMsg = 'WebSocket connection failed, using polling...';
				} else if (error.message.includes('auth')) {
					errorMsg = 'Authentication failed - please login again';
				} else if (error.message.includes('timeout')) {
					errorMsg = 'Connection timeout - retrying...';
				} else if (error.message.includes('ECONNREFUSED')) {
					errorMsg = 'Server refused connection - check if backend is running';
				} else if (error.message.includes('xhr poll error')) {
					errorMsg = 'Network error - check server connection';
				}
				
				setConnectionStatus(errorMsg);
				
				// Don't immediately reject, let it retry
				setTimeout(() => {
					if (!socket.connected) {
						reject(error);
					}
				}, 10000); // Increase wait time to 10 seconds
			});

			socket.on('group_message', async (data) =>
			{
				await handleIncomingMessage(data);
			});

			socket.on('member_joined', (data) =>
			{
				handleMemberJoined(data);
			});

			socket.on('member_left', (data) =>
			{
				handleMemberLeft(data);
			});

			socket.on('group_members', (data) =>
			{
				setMembers(data.members);
				checkKeyExchangeStatus(data.members);
			});

			socket.on('sender_key_distribution', async (data) =>
			{
				await handleSenderKeyDistribution(data);
			});

			socket.on('request_sender_key', async (data) =>
			{
				await handleSenderKeyRequest(data);
			});

			// Timeout for connection
			setTimeout(() =>
			{
				if (!socket.connected)
				{
					console.error('⏱️ Socket connection timeout after 20 seconds');
					console.error('   Check if backend is running at:', apiConfig.socketURL);
					reject(new Error('Socket connection timeout - backend may be offline'));
				}
			}, 20000); // Increased to 20 seconds to match connection timeout
		});
	};

	const handleIncomingMessage = async (data: any) =>
	{
		try
		{
			console.log('📨 [LIBSIGNAL] Incoming message from:', data.senderId);

			// Skip our own messages
			if (data.senderId === user!.id.toString())
			{
				return;
			}

			try
			{
				// Try to decrypt the message using libsignal
				const decryptedContent = await CryptoAPI.receiveGroupMessage(groupId, {
					...data.encryptedMessage,
					senderId: data.senderId
				});

				const message: Message = {
					id: data.encryptedMessage.messageId,
					senderId: data.senderId,
					senderName: data.senderName,
					content: decryptedContent,
					timestamp: data.encryptedMessage.timestamp,
					isEncrypted: true,
					isOwn: false,
				};

				setMessages(prev => [...prev, message]);
				console.log('✅ [LIBSIGNAL] Message decrypted successfully');

				// Auto-scroll to bottom
				setTimeout(() =>
				{
					flatListRef.current?.scrollToEnd({ animated: true });
				}, 100);
			}
			catch (decryptError: any)
			{
				console.error('❌ [LIBSIGNAL] Failed to decrypt message:', decryptError);

				// Store pending message and request sender key distribution
				const pendingId = `pending_${data.senderId}_${data.encryptedMessage.timestamp}`;

				setPendingMessages(prev =>
				{
					const newMap = new Map(prev);

					newMap.set(pendingId, data);
					return newMap;
				});

				// Request sender key with retry mechanism
				requestSenderKeyWithRetry(data.senderId, 1, false);

				// Show pending message with retry status
				const attempts = keyRequestAttempts.get(data.senderId) || 1;
				const pendingMessage: Message = {
					id: pendingId,
					senderId: data.senderId,
					senderName: data.senderName,
					content: `🔄 Waiting for encryption key... (Attempt ${attempts}/${KEY_REQUEST_CONFIG.MAX_ATTEMPTS})`,
					timestamp: data.encryptedMessage.timestamp,
					isEncrypted: false,
					isOwn: false,
				};

				setMessages(prev => [...prev, pendingMessage]);
			}
		}
		catch (error)
		{
			console.error('❌ [LIBSIGNAL] Failed to process incoming message:', error);

			// Show error message
			const errorMessage: Message = {
				id: `error_${Date.now()}`,
				senderId: data.senderId,
				senderName: data.senderName,
				content: '🔒 Message decryption failed',
				timestamp: data.encryptedMessage?.timestamp || Date.now(),
				isEncrypted: false,
				isOwn: false,
			};

			setMessages(prev => [...prev, errorMessage]);
		}
	};

	const handleMemberJoined = async (data: any) =>
	{
		console.log('👤 [LIBSIGNAL] Member joined:', data.username);

		// Update members list
		const newMembers = [
			...members.filter(m => m.userId !== data.userId),
			{
				userId: data.userId,
				username: data.username,
				isOnline: true,
			}
		];
		setMembers(newMembers);
		checkKeyExchangeStatus(newMembers);

		// Add system message
		const systemMessage: Message = {
			id: `system_${Date.now()}`,
			senderId: 'system',
			senderName: 'System',
			content: `${data.username} joined the group`,
			timestamp: Date.now(),
			isEncrypted: false,
			isOwn: false,
		};

		setMessages(prev => [...prev, systemMessage]);

		// Only start key exchange if this requires it (new member joining)
		if (data.requiresKeyExchange)
		{
			try
			{
				console.log('🔑 [LIBSIGNAL] Starting mutual key exchange with new member...');

				// 1. Send our sender key to the new member
				const senderKeyBundle = await CryptoAPI.getSenderKeyBundle(groupId);

				socketRef.current?.emit('sender_key_distribution', {
					groupId,
					targetUserId: data.userId,
					distributionMessage: senderKeyBundle,
				});

				console.log('✅ [LIBSIGNAL] Sent our sender key to new member');

				// 2. Request the new member's sender key with retry
				requestSenderKeyWithRetry(data.userId, 1, false);

				console.log('✅ [LIBSIGNAL] Requested sender key from new member');
			}
			catch (error: any)
			{
				console.error('❌ [LIBSIGNAL] Failed to complete mutual key exchange:', error);
			}
		}
	};

	const handleMemberLeft = (data: any) =>
	{
		console.log('👤 [LIBSIGNAL] Member left:', data.username);

		// Update members list
		setMembers(prev => prev.filter(m => m.userId !== data.userId));

		// Add system message
		const systemMessage: Message = {
			id: `system_${Date.now()}`,
			senderId: 'system',
			senderName: 'System',
			content: `${data.username} left the group`,
			timestamp: Date.now(),
			isEncrypted: false,
			isOwn: false,
		};

		setMessages(prev => [...prev, systemMessage]);

		// Remove member from crypto session
		CryptoAPI.removeGroupMember(groupId, data.userId).catch((error: any) =>
		{
			console.error('❌ [LIBSIGNAL] Failed to remove member from crypto session:', error);
		});
	};

	const handleSenderKeyDistribution = async (data: any) =>
	{
		try
		{
			console.log('🔑 [LIBSIGNAL] ===== PROCESSING SENDER KEY DISTRIBUTION =====');
			console.log('🔑 [LIBSIGNAL] From user:', data.fromUserId);

			// Add the new sender to our group crypto session
			await CryptoAPI.addGroupMember(groupId, data.distributionMessage);
			console.log('✅ [LIBSIGNAL] Sender key processed successfully');

					// Mark key exchange as complete for this user
		setKeyExchangeComplete(prev => {
			const newSet = new Set([...prev, data.fromUserId]);
			// Update key exchange status after state update
			setTimeout(() => checkKeyExchangeStatus(members), 0);
			return newSet;
		});
		console.log('🔑 [LIBSIGNAL] Key exchange marked complete for user:', data.fromUserId);

			// Try to decrypt any pending messages from this sender
			await processPendingMessages(data.fromUserId);
		}
		catch (error: any)
		{
			console.error('❌ [LIBSIGNAL] Failed to process sender key distribution:', error);
		}
	};

	const handleSenderKeyRequest = async (data: any) =>
	{
		try
		{
			console.log('🔑 [LIBSIGNAL] ===== SENDER KEY REQUESTED =====');
			console.log('🔑 [LIBSIGNAL] Requested by user:', data.fromUserId);

			const senderKeyBundle = await CryptoAPI.getSenderKeyBundle(groupId);

			socketRef.current?.emit('sender_key_distribution', {
				groupId,
				targetUserId: data.fromUserId,
				distributionMessage: senderKeyBundle,
			});

			console.log('✅ [LIBSIGNAL] Sender key sent to requester');
		}
		catch (error: any)
		{
			console.error('❌ [LIBSIGNAL] Failed to send sender key:', error);
		}
	};

	const processPendingMessages = async (senderId: string) =>
	{
		console.log('🔄 [LIBSIGNAL] Processing pending messages from:', senderId);

		const messagesToProcess: [string, any][] = [];

		// Find all pending messages from this sender
		pendingMessages.forEach((messageData, pendingId) =>
		{
			if (messageData.senderId === senderId)
			{
				messagesToProcess.push([pendingId, messageData]);
			}
		});

		console.log('🔄 [LIBSIGNAL] Found', messagesToProcess.length, 'messages to process');

		for (const [pendingId, messageData] of messagesToProcess)
		{
			try
			{
				// Try to decrypt the message now that we have the sender key
				const decryptedContent = await CryptoAPI.receiveGroupMessage(groupId, {
					...messageData.encryptedMessage,
					senderId: messageData.senderId
				});

				console.log('✅ [LIBSIGNAL] Successfully decrypted pending message:', pendingId);

				// Update the message in the UI
				setMessages(prev => prev.map(msg =>
				{
					if (msg.id === pendingId)
					{
						return {
							...msg,
							content: decryptedContent,
							isEncrypted: true,
						};
					}
					return msg;
				}));

				// Remove from pending messages
				setPendingMessages(prev =>
				{
					const newMap = new Map(prev);

					newMap.delete(pendingId);
					return newMap;
				});
			}
			catch (error: any)
			{
				console.error('❌ [LIBSIGNAL] Still cannot decrypt message:', pendingId, error);
			}
		}
	};

	const sendMessage = async () =>
	{
		if (!newMessage.trim() || !isInitialized)
		{
			return;
		}

		try
		{
			console.log('📤 [LIBSIGNAL] ===== SENDING ENCRYPTED MESSAGE =====');
			console.log('📤 [LIBSIGNAL] Message length:', newMessage.trim().length);

			// Encrypt message using libsignal
			const encryptedMessage = await CryptoAPI.sendGroupMessage(groupId, newMessage.trim());

			console.log('✅ [LIBSIGNAL] Message encrypted successfully');

			// Send encrypted message via socket
			socketRef.current?.emit('group_message', {
				groupId,
				encryptedMessage,
			});

			console.log('✅ [LIBSIGNAL] Encrypted message sent to server');

			// Add to local messages
			const message: Message = {
				id: encryptedMessage.messageId,
				senderId: user!.id.toString(),
				senderName: 'You',
				content: newMessage.trim(),
				timestamp: encryptedMessage.timestamp,
				isEncrypted: true,
				isOwn: true,
			};

			setMessages(prev => [...prev, message]);
			setNewMessage('');

			// Auto-scroll to bottom
			setTimeout(() =>
			{
				flatListRef.current?.scrollToEnd({ animated: true });
			}, 100);
		}
		catch (error: any)
		{
			console.error('❌ [LIBSIGNAL] Failed to send message:', error);
			Alert.alert('Error', 'Failed to send encrypted message. Please try again.');
		}
	};

	const leaveGroup = () =>
	{
		Alert.alert(
			'Leave Group',
			'Are you sure you want to leave this group?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Leave',
					style: 'destructive',
					onPress: () =>
					{
						socketRef.current?.emit('leave_group', { groupId });
						navigation.goBack();
					},
				},
			]
		);
	};

	// Render key status banner
	const renderKeyStatusBanner = () => {
		const hasPendingMessages = pendingMessages.size > 0;
		const missingKeys = Array.from(missingKeysAlert);
		const activeRetries = Array.from(keyRequestAttempts.entries()).filter(
			([userId, attempts]) => attempts > 0 && attempts <= KEY_REQUEST_CONFIG.MAX_ATTEMPTS
		);
		
		if (missingKeys.length === 0 && activeRetries.length === 0 && !hasPendingMessages) {
			return null;
		}
		
		return (
			<View style={styles.keyStatusBanner}>
				{activeRetries.length > 0 && (
					<View style={styles.keyStatusRow}>
						<ActivityIndicator size="small" color="#FFA500" />
						<Text style={styles.keyStatusText}>
							Requesting encryption keys from {activeRetries.length} user(s)...
						</Text>
					</View>
				)}
				
				{missingKeys.length > 0 && (
					<TouchableOpacity 
						style={styles.retryButton}
						onPress={requestAllMissingKeys}
					>
						<Text style={styles.retryButtonText}>
							⚠️ Missing keys from {missingKeys.length} user(s) - Tap to retry
						</Text>
					</TouchableOpacity>
				)}
			</View>
		);
	};

	const renderMessage = ({ item }: { item: Message }) =>
	{
		if (item.senderId === 'system')
		{
			return (
				<View style={styles.systemMessageContainer}>
					<Text style={styles.systemMessageText}>{item.content}</Text>
				</View>
			);
		}

		return (
			<View style={[
				styles.messageContainer,
				item.isOwn ? styles.ownMessage : styles.otherMessage,
			]}>
				{!item.isOwn && (
					<Text style={styles.senderName}>{item.senderName}</Text>
				)}
				<Text style={[
					styles.messageText,
					!item.isEncrypted && styles.errorText,
				]}>
					          {item.content}
					{item.isEncrypted && ' 🔐'}
				</Text>
				<Text style={styles.messageTime}>
					{new Date(item.timestamp).toLocaleTimeString()}
				</Text>
			</View>
		);
	};

	if (isLoading)
	{
		return (
			<View style={styles.welcomeContainer}>
				<View style={styles.infoContainer}>
					<Text style={styles.infoTitle}>Initializing Signal Protocol</Text>
					<Text style={styles.infoText}>
            Setting up end-to-end encryption using @signalapp/libsignal-client...
					</Text>
					<Text style={styles.statusText}>{connectionStatus}</Text>
				</View>
			</View>
		);
	}

	if (isWaitingForKeys && members.length > 1)
	{
		return (
			<View style={styles.welcomeContainer}>
				<View style={styles.infoContainer}>
					<Text style={styles.infoTitle}>🔐 Échange de clés en cours</Text>
					<Text style={styles.infoText}>
            Établissement du chiffrement de bout en bout avec tous les membres...
					</Text>
					<Text style={styles.statusText}>{keyExchangeStatus}</Text>
					<View style={styles.membersList}>
						{members.map((member, index) => (
							<View key={member.userId} style={styles.memberItem}>
								<Text style={styles.memberText}>
									{member.userId === user!.id ? '🔵 Vous' : `👤 ${member.username}`}
								</Text>
								<Text style={styles.memberStatus}>
									{member.userId === user!.id 
										? '✅ Prêt' 
										: keyExchangeComplete.has(member.userId) 
											? '✅ Clés échangées' 
											: '🔄 En attente...'}
								</Text>
							</View>
						))}
					</View>
				</View>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<View style={styles.chatContainer}>
				<View style={styles.groupInfo}>
					<View>
						<Text style={styles.groupTitle}>🔐 {groupName}</Text>
						<Text style={styles.statusText}>
							{members.length} members • {connectionStatus}
						</Text>
					</View>
					<TouchableOpacity style={styles.leaveButton} onPress={leaveGroup}>
						<Text style={styles.leaveButtonText}>Leave</Text>
					</TouchableOpacity>
				</View>
				
				{renderKeyStatusBanner()}

				<FlatList
					ref={flatListRef}
					data={messages}
					renderItem={renderMessage}
					keyExtractor={(item) => item.id}
					style={styles.messagesList}
					showsVerticalScrollIndicator={false}
				/>

				<View style={styles.inputContainer}>
					<TextInput
						style={styles.messageInput}
						value={newMessage}
						onChangeText={setNewMessage}
						placeholder="Type a message (Signal Protocol encrypted)..."
						placeholderTextColor="#666"
						multiline
						maxLength={1000}
						editable={isInitialized}
					/>
					<TouchableOpacity
						style={[styles.sendButton, (!newMessage.trim() || !isInitialized) && { opacity: 0.5 }]}
						onPress={sendMessage}
						disabled={!newMessage.trim() || !isInitialized}
					>
						<Text style={styles.sendButtonText}>Send</Text>
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}