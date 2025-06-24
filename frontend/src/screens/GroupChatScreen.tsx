import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	FlatList,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { groupChatCrypto, EncryptedMessage, GroupMember } from "../crypto";
import { socket, connectWithAuth } from "../api/socket";
import { useAuth } from "../hooks/useAuth";
import BackButton from "../components/backNavigation";
import Button from "../components/button";
import Mascot from "../components/mascot";
import styles from "./GroupChatScreen.style";

interface ChatMessage {
	id: string;
	content: string;
	senderId: string;
	senderUsername: string;
	timestamp: Date;
	isDecrypted: boolean;
}

interface GroupChatUser {
	userId: string;
	username: string;
	isOnline: boolean;
}

interface GroupChatScreenProps 
{
	navigation: {
		goBack: () => void;
	};
}

const GroupChatScreen = ({ navigation }: GroupChatScreenProps) => 
{
	const { user } = useAuth();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMessage, setNewMessage] = useState("");
	const [isConnected, setIsConnected] = useState(false);
	const [isJoiningGroup, setIsJoiningGroup] = useState(false);
	const [waitroomStatus, setWaitroomStatus] = useState<{isWaiting: boolean; message: string; waitingCount: number} | null>(null);
	const [groupUsers, setGroupUsers] = useState<GroupChatUser[]>([]);
	const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
	const flatListRef = useRef<FlatList>(null);
	const currentGroupIdRef = useRef<string | null>(null);
	const lastKeyExchangeTime = useRef<number>(0);
	const KEY_EXCHANGE_DEBOUNCE = 500; // Reduced to 500ms to allow faster responses

	useEffect(() => {
		if (user) {
			initializeCrypto();
			setupSocketConnection();
		}

		// Set up periodic cleanup of expired key exchanges
		const cleanupInterval = setInterval(() => {
			groupChatCrypto.cleanupExpiredExchanges();
		}, 5000); // Check every 5 seconds

		return () => {
			clearInterval(cleanupInterval);
			// Clean up socket listeners
			socket.off("group_message");
			socket.off("user_joined_group");
			socket.off("user_left_group");
			socket.off("user_left");
			socket.off("group_users_list");
			socket.off("joined_random_group");
			socket.off("group_joined");
			socket.off("crypto_key_exchange");
			
			if (socket.connected) {
				socket.disconnect();
			}
		};
	}, [user]);

	// Keep ref in sync with state
	useEffect(() => {
		currentGroupIdRef.current = currentGroupId;
	}, [currentGroupId]);

	// Handle component unmount - leave group when screen is actually unmounted
	useEffect(() => {
		return () => {
			// This cleanup will run when the component is unmounted
			if (currentGroupIdRef.current && socket.connected) {
				socket.emit("leave_group", { groupId: currentGroupIdRef.current }, (response: any) => {
					console.log("Component unmount: Left group", response?.message || "");
				});
			}
		};
	}, []); // Empty dependency array means this only runs on mount/unmount

	const initializeCrypto = async () => 
{
		try 
{
			if (!user?.id) 
{
				throw new Error("User not authenticated");
			}

			await groupChatCrypto.initializeUser(user.id.toString());
		} catch (error) {
			console.error("Failed to initialize crypto:", error);
			Alert.alert("Erreur", "Impossible d'initialiser le chiffrement");
		}
	};

	const setupSocketConnection = async () => 
{
		try 
{
			const connected = await connectWithAuth();

			if (!connected) 
{
				Alert.alert("Erreur", "Impossible de se connecter au chat");
				return;
			}

			setIsConnected(true);
			setupSocketListeners();
		} catch (error) {
			console.error("Socket connection error:", error);
		}
	};

	const setupSocketListeners = () => 
	{
		console.log("🔧 Setting up socket listeners...");
		
		socket.on("group_message", (data) => {
			console.log("📨 group_message event received:", data);
			handleIncomingMessage(data);
		});
		
		socket.on("user_joined_group", (data) => {
			console.log("👤 user_joined_group event received:", data);
			handleUserJoinedGroup(data);
		});
		
		socket.on("user_left_group", (data) => {
			console.log("👋 user_left_group event received:", data);
			handleUserLeftGroup(data);
		});
		
		socket.on("user_left", (data) => {
			console.log("🚪 user_left event received:", data);
			handleUserLeft(data);
		});
		
		socket.on("group_users_list", (data) => {
			console.log("👥 group_users_list event received:", data);
			handleGroupUsersList(data);
		});
		
		socket.on("joined_random_group", (data) => {
			console.log("🎉 joined_random_group event received:", data);
			handleJoinedRandomGroup(data);
		});
		
		socket.on("joined_existing_group", (data) => {
			console.log("➕ joined_existing_group event received:", data);
			handleJoinedExistingGroup(data);
		});
		
		socket.on("joined_waitroom", (data) => {
			console.log("⏳ joined_waitroom event received:", data);
			handleJoinedWaitroom(data);
		});
		
		socket.on("waitroom_cleared", () => {
			console.log("🧹 waitroom_cleared event received");
			handleWaitroomCleared();
		});
		
		socket.on("group_joined", (data) => {
			console.log("🎯 group_joined event received:", data);
			handleGroupJoined(data);
		});
		
		socket.on("crypto_key_exchange", (data) => {
			console.log("🔐 crypto_key_exchange event received:", data);
			handleKeyExchange(data);
		});
		
		socket.on("request_key_exchange", (data) => {
			console.log("🔄 request_key_exchange event received:", data);
			handleRequestKeyExchange(data);
		});
		
		// Add error event listener
		socket.on("error", (error) => {
			console.error("❌ Socket error received:", error);
			Alert.alert("Erreur de connexion", error.message || "Erreur inconnue");
		});
		
		console.log("✅ Socket listeners set up successfully");
	};

	const handleIncomingMessage = async (data: {
		messageId: string;
		encryptedMessage: EncryptedMessage | string;
		groupId: string;
		senderUsername: string;
	}) => 
	{
		console.log("📨 Processing incoming message:", {
			messageId: data.messageId,
			groupId: data.groupId,
			senderUsername: data.senderUsername,
			encryptedMessage: typeof data.encryptedMessage
		});

		// Parse encrypted message if it's a string
		let encryptedMessage: EncryptedMessage;
		try {
			encryptedMessage = typeof data.encryptedMessage === 'string' 
				? JSON.parse(data.encryptedMessage) as EncryptedMessage
				: data.encryptedMessage;
		} catch (parseError) {
			console.error("❌ Failed to parse encrypted message:", parseError);
			const errorMessage: ChatMessage = {
				id: data.messageId,
				content: "❌ Message corrompu (erreur de format)",
				senderId: 'unknown',
				senderUsername: data.senderUsername,
				timestamp: new Date(),
				isDecrypted: false,
			};
			setMessages(prev => [...prev, errorMessage]);
			return;
		}

		console.log("🔍 Encrypted message details:", {
			keyVersion: encryptedMessage.keyVersion,
			senderId: encryptedMessage.senderId,
			timestamp: encryptedMessage.timestamp,
			contentLength: encryptedMessage.content?.length
		});

		// Skip our own messages to prevent duplicates
		if (user?.id?.toString() === encryptedMessage.senderId) {
			console.log("⏭️ Skipping own message to prevent duplicate");
			return;
		}

		let decryptedContent: string;
		let isDecrypted = true;

		try {
			// Attempt to decrypt the message
			decryptedContent = await groupChatCrypto.decryptMessage(data.groupId, encryptedMessage);
			console.log("✅ Message decrypted successfully");
		} catch (decryptError) {
			console.error("❌ Failed to decrypt message:", decryptError);
			
			// Handle different types of decryption errors
			const errorMessage = decryptError instanceof Error ? decryptError.message : String(decryptError);
			
			if (errorMessage.includes("key exchange needed") || errorMessage.includes("newer key version")) {
				decryptedContent = "🔄 Message en attente de synchronisation des clés...";
				console.log("🔄 Message requires key exchange - will retry after sync");
			} else if (errorMessage.includes("Group key not found")) {
				decryptedContent = "⚠️ Clés de groupe manquantes - échange de clés requis";
			} else {
				decryptedContent = "❌ Impossible de déchiffrer ce message";
			}
			
			isDecrypted = false;
		}

		const messageToAdd: ChatMessage = {
			id: data.messageId,
			content: decryptedContent,
			senderId: encryptedMessage.senderId,
			senderUsername: data.senderUsername,
			timestamp: new Date(encryptedMessage.timestamp),
			isDecrypted: isDecrypted,
		};

		setMessages(prev => {
			// Check if message already exists to prevent duplicates
			const exists = prev.some(msg => msg.id === data.messageId);
			if (exists) {
				console.log("⏭️ Message already exists, skipping");
				return prev;
			}
			
			const newMessages = [...prev, messageToAdd];
			console.log(`📝 Added message to chat (total: ${newMessages.length})`);
			return newMessages;
		});

		// Scroll to bottom after adding message
		setTimeout(() => {
			flatListRef.current?.scrollToEnd({ animated: true });
		}, 100);
	};

	const handleUserJoinedGroup = async (data: {
		user: GroupChatUser;
		groupId: string;
		members: GroupMember[];
	}) => 
	{
		const currentGroup = currentGroupIdRef.current;
		if (!currentGroup || data.groupId !== currentGroup) 
		{
			console.log(`🚫 User joined event ignored - wrong group. Current: ${currentGroup}, Event: ${data.groupId}`);
			return;
		}

		console.log(`👤 User ${data.user.userId} joined group ${data.groupId}, updating member count`);
		
		// Add a system message about the user joining
		const joinMessage: ChatMessage = {
			id: `join_${Date.now()}`,
			content: `${data.user.username} a rejoint le groupe`,
			senderId: 'system',
			senderUsername: 'Système',
			timestamp: new Date(),
			isDecrypted: true,
		};

		setMessages(prev => [...prev, joinMessage]);
		
		// Update group users based on the members list from the server
		// This ensures we have the correct count and avoid duplicates
		const activeMembers = data.members.filter(member => member.isActive);
		const groupUsers: GroupChatUser[] = activeMembers.map(member => ({
			userId: member.userId,
			username: member.userId, // Use userId as username since we don't have usernames from this event
			isOnline: member.isActive,
		}));
		
		setGroupUsers(groupUsers);
		console.log(`👥 Group users updated: ${groupUsers.length} active members (total: ${data.members.length})`);

		try 
		{
			if (user?.id) 
			{
				const newMember: GroupMember = {
					userId: data.user.userId,
					publicKey: "", // Will be exchanged via crypto
					isActive: true,
				};

				await groupChatCrypto.handleNewMemberJoin(
					data.groupId,
					newMember,
					data.members
				);
			}
		} catch (error) {
			console.error("Failed to handle user join:", error);
		}
	};

	const handleUserLeftGroup = async (data: {
		userId: string;
		groupId: string;
		remainingMembers: GroupMember[];
	}) => 
	{
		const currentGroup = currentGroupIdRef.current;
		if (!currentGroup || data.groupId !== currentGroup) 
		{
			return;
		}

		// Find the username of the user who left
		const leavingUser = groupUsers.find(u => u.userId === data.userId);
		const leavingUsername = leavingUser?.username || data.userId;

		// Add a system message about the user leaving
		const leaveMessage: ChatMessage = {
			id: `leave_${Date.now()}`,
			content: `${leavingUsername} a quitté le groupe`,
			senderId: 'system',
			senderUsername: 'Système',
			timestamp: new Date(),
			isDecrypted: true,
		};

		setMessages(prev => [...prev, leaveMessage]);

		setGroupUsers(prev => {
			const updatedUsers = prev.filter(u => u.userId !== data.userId);
			console.log(`👥 Group users updated: ${updatedUsers.length} active members remaining`);
			return updatedUsers;
		});

		try 
		{
			await groupChatCrypto.handleMemberLeave(
				data.groupId,
				data.userId,
				data.remainingMembers
			);
		} catch (error) {
			console.error("Failed to handle user leave:", error);
		}
	};

	const handleUserLeft = (data: {
		userId: number;
		login: string;
		timestamp: Date;
	}) => 
{
		// This is fired when any user (including ourselves) leaves the group
		console.log(`User ${data.login} left the group`);
		setGroupUsers(prev => prev.filter(u => u.userId !== data.userId.toString()));
		
		// If the current user left, reset the group state
		if (user?.id === data.userId) {
			setCurrentGroupId(null);
			setMessages([]);
			setGroupUsers([]);
		}
	};

	const handleGroupUsersList = (users: GroupChatUser[]) => 
{
		setGroupUsers(users);
	};

	const handleJoinedRandomGroup = async (data: {
		groupId: string;
		members: GroupMember[];
	}) => 
	{
		console.log("🎉 Group created! Joining group:", data.groupId);
		
		// Set the group ID immediately and also update the ref
		setCurrentGroupId(data.groupId);
		currentGroupIdRef.current = data.groupId; // Update ref immediately
		
		setIsJoiningGroup(false);
		setWaitroomStatus(null); // Clear waitroom status

		// Set group users for display with member count (only active members)
		const activeMembers = data.members.filter(member => member.isActive);
		const groupUsers: GroupChatUser[] = activeMembers.map(member => ({
			userId: member.userId,
			username: member.userId, // Use userId as username since we don't have usernames from this event
			isOnline: member.isActive,
		}));
		setGroupUsers(groupUsers);
		console.log(`👥 Set group users: ${groupUsers.length} active members (total: ${data.members.length})`);

		try 
		{
			if (user?.id) 
			{
				const currentUserMember: GroupMember = {
					userId: user.id.toString(),
					publicKey: "", // Will be set by crypto manager
					isActive: true,
				};

				await groupChatCrypto.joinGroup(
					data.groupId,
					currentUserMember,
					data.members
				);
				console.log(`🔐 Crypto initialized for group ${data.groupId}`);
				
				// Key exchange will be triggered by the backend automatically
			}
		} catch (error) {
			console.error("Failed to initialize crypto for group:", error);
		}
	};

	const handleJoinedExistingGroup = async (data: {
		groupId: string;
		members: GroupMember[];
	}) => 
	{
		console.log("➕ Joining existing group:", data.groupId);
		
		// Set the group ID immediately and also update the ref
		setCurrentGroupId(data.groupId);
		currentGroupIdRef.current = data.groupId; // Update ref immediately
		
		setIsJoiningGroup(false);
		setWaitroomStatus(null); // Clear waitroom status

		// Set group users for display with member count (only active members)
		const activeMembers = data.members.filter(member => member.isActive);
		const groupUsers: GroupChatUser[] = activeMembers.map(member => ({
			userId: member.userId,
			username: member.userId, // Use userId as username since we don't have usernames from this event
			isOnline: member.isActive,
		}));
		setGroupUsers(groupUsers);
		console.log(`👥 Set group users: ${groupUsers.length} active members (total: ${data.members.length})`);

		try 
		{
			if (user?.id) 
			{
				const currentUserMember: GroupMember = {
					userId: user.id.toString(),
					publicKey: "", // Will be set by crypto manager
					isActive: true,
				};

				await groupChatCrypto.joinGroup(
					data.groupId,
					currentUserMember,
					data.members
				);
				console.log(`🔐 Crypto initialized for existing group ${data.groupId}`);
				
				// Key exchange will be triggered by the backend automatically
			}
		} catch (error) {
			console.error("Failed to initialize crypto for existing group:", error);
		}
	};

	const handleJoinedWaitroom = (data: { message: string; waitingCount: number }) => {
		console.log("🎯 Joined waitroom:", data);
		setWaitroomStatus({
			isWaiting: true,
			message: data.message,
			waitingCount: data.waitingCount
		});
		setIsJoiningGroup(false); // Stop the initial loading state
	};

	const handleWaitroomCleared = () => {
		console.log("🧹 Waitroom cleared - preparing for group");
		setWaitroomStatus(null);
		setIsJoiningGroup(false);
	};

	const handleGroupJoined = async (data: {
		success: boolean;
		group?: {
			id: string;
			name: string;
			currentMembers: number;
			maxMembers: number;
			members: Array<{
				userId: number;
				login: string;
				publicKey?: string;
				joinedAt: Date;
			}>;
		};
		message?: string;
	}) => 
{
		if (data.success && data.group) 
{
			setCurrentGroupId(data.group.id);
			setIsJoiningGroup(false);

			// Convert backend member format to frontend format
			const groupMembers: GroupMember[] = data.group.members.map(member => ({
				userId: member.userId.toString(),
				publicKey: member.publicKey || "",
				isActive: true,
			}));

			// Set group users for display
			const groupUsers: GroupChatUser[] = data.group.members.map(member => ({
				userId: member.userId.toString(),
				username: member.login,
				isOnline: true,
			}));
			setGroupUsers(groupUsers);

			try 
{
				if (user?.id) 
{
					const currentUserMember: GroupMember = {
						userId: user.id.toString(),
						publicKey: "", // Will be set by crypto manager
						isActive: true,
					};

					await groupChatCrypto.joinGroup(
						data.group.id,
						currentUserMember,
						groupMembers
					);
				}
			} catch (error) {
				console.error("Failed to setup group encryption:", error);
			}
		} else {
			setIsJoiningGroup(false);
			Alert.alert("Erreur", data.message || "Impossible de rejoindre le groupe");
		}
	};

	const handleKeyExchange = async (keyExchangeData: any) => 
{
		try 
{
			await groupChatCrypto.handleKeyExchange(keyExchangeData);
		} catch (error) {
			console.error("Failed to handle key exchange:", error);
		}
	};

	const handleRequestKeyExchange = async (data: {
		type: "NEW_MEMBER" | "MEMBER_LEFT";
		groupId: string;
		remainingMembers?: GroupMember[];
		allMembers?: GroupMember[];
	}) => 
	{
		console.log(`🔄 Key exchange requested for ${data.type} in group ${data.groupId}`);
		
		// Use group-specific debouncing to allow concurrent exchanges for different groups
		const debounceKey = `${data.groupId}_${data.type}`;
		const now = Date.now();
		if (now - lastKeyExchangeTime.current < KEY_EXCHANGE_DEBOUNCE) {
			console.log(`⏱️ Key exchange debounced for group ${data.groupId} (last: ${now - lastKeyExchangeTime.current}ms ago)`);
			return;
		}
		lastKeyExchangeTime.current = now;
		
		// Add a system message about the key exchange
		const keyExchangeMessage: ChatMessage = {
			id: `key_exchange_${Date.now()}`,
			content: data.type === "NEW_MEMBER" 
				? "🔄 Échange de clés en cours pour le nouveau membre..." 
				: "🔄 Échange de clés en cours suite au départ d'un membre...",
			senderId: 'system',
			senderUsername: 'Système',
			timestamp: new Date(),
			isDecrypted: true,
		};
		
		setMessages(prev => [...prev, keyExchangeMessage]);
		
		try 
		{
			// Get the current user's key pair
			const userKeyPair = await groupChatCrypto.getUserKeyPair();
			
			if (!userKeyPair) 
			{
				console.error("❌ No user key pair found for key exchange");
				throw new Error("User key pair not found");
			}

			// Use member list from the backend if provided
			const membersToUse = data.remainingMembers || data.allMembers;
			if (membersToUse && membersToUse.length > 0) {
				console.log(`🔍 Using ${membersToUse.length} members from backend: ${membersToUse.map(m => m.userId).join(', ')}`);
				
				// Find current user in the member list or create entry
				const currentUserMember = membersToUse.find(m => m.userId === userKeyPair.userId) || {
					userId: userKeyPair.userId,
					publicKey: userKeyPair.publicKey,
					isActive: true
				};
				
				// Initialize the key exchange with the provided member list
				if (data.type === "NEW_MEMBER") {
					const existingMembers = membersToUse.filter(m => m.userId !== userKeyPair.userId);
					await groupChatCrypto.handleNewMemberJoin(
						data.groupId,
						currentUserMember,
						existingMembers
					);
				} else {
					await groupChatCrypto.handleMemberLeave(
						data.groupId,
						userKeyPair.userId,
						membersToUse
					);
				}
			} else {
				console.log(`⚠️ No member list provided, proceeding with basic key exchange`);
			}

			// Create key exchange message
			const keyExchangeMessageData = {
				type: data.type,
				userId: userKeyPair.userId,
				publicKey: userKeyPair.publicKey,
				groupId: data.groupId,
				timestamp: new Date()
			};

			console.log(`📤 Sending key exchange message:`, keyExchangeMessageData);
			
			// Send the key exchange message to the server
			socket.emit("crypto_key_exchange", keyExchangeMessageData);
			
			console.log(`✅ Key exchange message sent for ${data.type}`);
		} catch (error) {
			console.error("❌ Failed to handle key exchange:", error);
			
			// Add error message to chat
			const errorMessage: ChatMessage = {
				id: `key_exchange_error_${Date.now()}`,
				content: "❌ Erreur lors de l'échange de clés. Certains messages peuvent ne pas être déchiffrables.",
				senderId: 'system',
				senderUsername: 'Système',
				timestamp: new Date(),
				isDecrypted: true,
			};
			
			setMessages(prev => [...prev, errorMessage]);
		}
	};

	const joinRandomGroup = async () => 
{
		console.log("🎯 joinRandomGroup called");
		console.log("🔍 isConnected:", isConnected);
		
		if (!isConnected) 
{
			console.log("❌ Not connected to server");
			Alert.alert("Erreur", "Non connecté au serveur");
			return;
		}

		try 
{
			console.log("🔐 Getting user key pair...");
			// Get user's public key from crypto system
			const userKeyPair = await groupChatCrypto.getUserKeyPair();
			console.log("🔍 userKeyPair:", userKeyPair ? "✅ Found" : "❌ Not found");
			
			if (!userKeyPair) 
{
				console.log("❌ No user key pair available");
				Alert.alert("Erreur", "Clés de chiffrement non initialisées");
				return;
			}

			console.log("🎲 Setting joining state and emitting event...");
			setIsJoiningGroup(true);
			setMessages([]);
			
			console.log("📡 Emitting join_random_group with publicKey:", userKeyPair.publicKey.substring(0, 20) + "...");
			socket.emit("join_random_group", {
				publicKey: userKeyPair.publicKey
			});
			console.log("✅ join_random_group event emitted");
		} catch (error) {
			console.error("❌ Error in joinRandomGroup:", error);
			setIsJoiningGroup(false);
			Alert.alert("Erreur", "Impossible de récupérer les clés de chiffrement");
		}
	};

	const leaveGroup = () => 
	{
		const currentGroup = currentGroupIdRef.current;
		if (currentGroup) 
		{
			socket.emit("leave_group", { groupId: currentGroup }, (response: any) => {
				if (response && response.success) {
					console.log("Successfully left group:", response.message);
					setCurrentGroupId(null);
					currentGroupIdRef.current = null; // Clear ref too
					setMessages([]);
					setGroupUsers([]);
				} else {
					console.error("Failed to leave group:", response?.message || "Unknown error");
					Alert.alert("Erreur", "Impossible de quitter le groupe");
				}
			});
		}
	};

	const sendMessage = async () => 
	{
		const currentGroup = currentGroupIdRef.current;
		if (!newMessage.trim() || !currentGroup || !user?.id) 
		{
			return;
		}

		try 
		{
			const encryptedMessage = await groupChatCrypto.encryptMessage(
				currentGroup,
				newMessage.trim()
			);

			socket.emit("send_group_message", {
				groupId: currentGroup,
				encryptedMessage: JSON.stringify(encryptedMessage),
			});

			const messageToAdd: ChatMessage = {
				id: `local_${Date.now()}`,
				content: newMessage.trim(),
				senderId: user.id.toString(),
				senderUsername: user.login,
				timestamp: new Date(),
				isDecrypted: true,
			};

			setMessages(prev => [...prev, messageToAdd]);
			setNewMessage("");
		} catch (error) {
			console.error("Failed to send message:", error);
			Alert.alert("Erreur", "Impossible d'envoyer le message");
		}
	};

	const renderMessage = ({ item }: { item: ChatMessage }) => 
	{
		const isCurrentUser = user?.id?.toString() === item.senderId;
		const isSystemMessage = item.senderId === 'system';

		return (
			<View
				style={[
					styles.messageContainer,
					isSystemMessage 
						? styles.systemMessageContainer
						: isCurrentUser 
							? styles.currentUserMessage 
							: styles.otherUserMessage,
				]}
			>
				{!isSystemMessage && !isCurrentUser && (
					<Text style={styles.senderName}>
						{item.senderUsername}
					</Text>
				)}
				{!isSystemMessage && isCurrentUser && (
					<Text style={styles.sentIndicator}>
						✓ Envoyé
					</Text>
				)}
				<Text
					style={[
						styles.messageText,
						isSystemMessage && styles.systemMessageText,
						!item.isDecrypted && styles.encryptedMessageText,
					]}
				>
					{item.content}
				</Text>
				<Text style={styles.messageTime}>
					{item.timestamp.toLocaleTimeString()}
				</Text>
			</View>
		);
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<BackButton
				onPress={() => {
					// Leave group before navigating back
					if (currentGroupIdRef.current && socket.connected) {
						socket.emit("leave_group", { groupId: currentGroupIdRef.current }, (response: any) => {
							console.log("Back button: Left group", response?.message || "");
							navigation.goBack();
						});
					} else {
						navigation.goBack();
					}
				}}
			/>

			{!currentGroupId ? (
				<View style={styles.welcomeContainer}>
					<Mascot
						mascot="happy"
						text="Rejoignez un cercle de parole anonyme et chiffré pour échanger en toute sécurité."
					/>

					<View style={styles.infoContainer}>
						<Text style={styles.infoTitle}>
							Chiffrement de bout en bout
						</Text>
						<Text style={styles.infoText}>
							Vos messages sont chiffrés sur votre appareil et
							seuls les membres du groupe peuvent les lire.
						</Text>
					</View>

					{waitroomStatus?.isWaiting ? (
						<View style={styles.waitroomContainer}>
							<Text style={styles.waitroomTitle}>🔍 Recherche en cours...</Text>
							<Text style={styles.waitroomMessage}>{waitroomStatus.message}</Text>
							<Text style={styles.waitroomCount}>
								{waitroomStatus.waitingCount} personne{waitroomStatus.waitingCount > 1 ? 's' : ''} en attente
							</Text>
							<Text style={styles.waitroomHelp}>
								Nous recherchons d'autres utilisateurs pour former un groupe.
							</Text>
							<Button
								title="Annuler"
								onPress={() => {
									setWaitroomStatus(null);
									setIsJoiningGroup(false);
								}}
								style={styles.cancelButton}
							/>
						</View>
					) : (
						<Button
							title={
								isJoiningGroup
									? "Connexion..."
									: "Rejoindre un cercle"
							}
							onPress={joinRandomGroup}
							disabled={!isConnected || isJoiningGroup}
						/>
					)}

					<Text style={styles.statusText}>
						{isConnected ? "✅ Connecté" : "❌ Non connecté"}
					</Text>
				</View>
			) : (
				<View style={styles.chatContainer}>
					<View style={styles.groupInfo}>
						<Text style={styles.groupTitle}>
							Cercle actuel ({groupUsers.length} membres)
						</Text>
						<TouchableOpacity
							style={styles.leaveButton}
							onPress={leaveGroup}
						>
							<Text style={styles.leaveButtonText}>Quitter</Text>
						</TouchableOpacity>
					</View>

					<FlatList
						ref={flatListRef}
						data={messages}
						renderItem={renderMessage}
						keyExtractor={item => item.id}
						style={styles.messagesList}
						onContentSizeChange={() =>
							flatListRef.current?.scrollToEnd()
						}
					/>

					<View style={styles.inputContainer}>
						<TextInput
							style={styles.messageInput}
							value={newMessage}
							onChangeText={setNewMessage}
							placeholder="Tapez votre message..."
							multiline
							maxLength={500}
						/>
						<TouchableOpacity
							style={styles.sendButton}
							onPress={sendMessage}
							disabled={!newMessage.trim()}
						>
							<Text style={styles.sendButtonText}>Envoyer</Text>
						</TouchableOpacity>
					</View>
				</View>
			)}
		</KeyboardAvoidingView>
	);
};

export default GroupChatScreen;