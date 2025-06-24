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

	useEffect(() => 
{
		if (user) 
{
			initializeCrypto();
			setupSocketConnection();
		}

		return () => 
{
			// Clean up socket listeners
			socket.off("group_message");
			socket.off("user_joined_group");
			socket.off("user_left_group");
			socket.off("user_left");
			socket.off("group_users_list");
			socket.off("joined_random_group");
			socket.off("group_joined");
			socket.off("crypto_key_exchange");
			
			if (socket.connected) 
{
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
		socket.on("group_message", handleIncomingMessage);
		socket.on("user_joined_group", handleUserJoinedGroup);
		socket.on("user_left_group", handleUserLeftGroup);
		socket.on("user_left", handleUserLeft);
		socket.on("group_users_list", handleGroupUsersList);
		socket.on("joined_random_group", handleJoinedRandomGroup);
		socket.on("joined_waitroom", handleJoinedWaitroom);
		socket.on("waitroom_cleared", handleWaitroomCleared);
		socket.on("group_joined", handleGroupJoined);
		socket.on("crypto_key_exchange", handleKeyExchange);
	};

	const handleIncomingMessage = async (data: {
		messageId: string;
		encryptedMessage: EncryptedMessage | string;
		groupId: string;
		senderUsername: string;
	}) => 
{
		try 
{
			if (!currentGroupId || data.groupId !== currentGroupId) 
{
				return;
			}

			// Parse the encrypted message if it's a string
			const encryptedMessage = typeof data.encryptedMessage === 'string' 
				? JSON.parse(data.encryptedMessage) as EncryptedMessage
				: data.encryptedMessage;

			const decryptedContent = await groupChatCrypto.decryptMessage(
				data.groupId,
				encryptedMessage
			);

			const newMessage: ChatMessage = {
				id: data.messageId,
				content: decryptedContent,
				senderId: encryptedMessage.senderId,
				timestamp: new Date(encryptedMessage.timestamp),
				isDecrypted: true,
			};

			setMessages(prev => [...prev, newMessage]);
		} catch (error) {
			console.error("Failed to decrypt message:", error);

			// Parse the encrypted message for error case too
			const encryptedMessageForError = typeof data.encryptedMessage === 'string' 
				? JSON.parse(data.encryptedMessage) as EncryptedMessage
				: data.encryptedMessage;

			const errorMessage: ChatMessage = {
				id: data.messageId,
				content: "[Message non déchiffrable]",
				senderId: encryptedMessageForError.senderId,
				timestamp: new Date(encryptedMessageForError.timestamp),
				isDecrypted: false,
			};

			setMessages(prev => [...prev, errorMessage]);
		}
	};

	const handleUserJoinedGroup = async (data: {
		user: GroupChatUser;
		groupId: string;
		members: GroupMember[];
	}) => 
{
		if (!currentGroupId || data.groupId !== currentGroupId) 
{
			return;
		}

		setGroupUsers(prev => [...prev, data.user]);

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
		if (!currentGroupId || data.groupId !== currentGroupId) 
{
			return;
		}

		setGroupUsers(prev => prev.filter(u => u.userId !== data.userId));

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
		setCurrentGroupId(data.groupId);
		setIsJoiningGroup(false);
		setWaitroomStatus(null); // Clear waitroom status

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
			}
		} catch (error) {
			console.error("Failed to setup group encryption:", error);
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
		if (currentGroupId) 
{
			socket.emit("leave_group", { groupId: currentGroupId }, (response: any) => {
				if (response && response.success) {
					console.log("Successfully left group:", response.message);
					setCurrentGroupId(null);
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
		if (!newMessage.trim() || !currentGroupId || !user?.id) 
{
			return;
		}

		try 
{
			const encryptedMessage = await groupChatCrypto.encryptMessage(
				currentGroupId,
				newMessage.trim()
			);

			socket.emit("send_group_message", {
				groupId: currentGroupId,
				encryptedMessage: JSON.stringify(encryptedMessage),
			});

			const messageToAdd: ChatMessage = {
				id: `local_${Date.now()}`,
				content: newMessage.trim(),
				senderId: user.id.toString(),
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
		const isOwnMessage = item.senderId === user?.id?.toString();

		return (
			<View
				style={[
					styles.messageContainer,
					isOwnMessage ? styles.ownMessage : styles.otherMessage,
				]}
			>
				<Text
					style={[
						styles.messageText,
						!item.isDecrypted && styles.errorText,
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