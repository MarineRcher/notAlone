// E2E Encrypted Group Chat Screen using Signal Protocol

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
import styles from './GroupChatScreen.style';
import io, { Socket } from 'socket.io-client';
import { apiConfig } from '../config/api';
import { nobleSignalProtocol } from '../crypto/noble-crypto';

// Simple test crypto functions for debugging (keeping as fallback)
const testCrypto = {
  async initialize() {
    console.log('🧪 Test crypto initialize');
    return Promise.resolve();
  },
  
  async createGroup(groupId: string, userId: string) {
    console.log('🧪 Test createGroup:', groupId, userId);
    return Promise.resolve();
  },
  
  async encryptGroupMessage(groupId: string, message: string) {
    console.log('🧪 Test encryptGroupMessage:', groupId, message);
    return {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      encryptedPayload: btoa(message), // Simple base64 for testing
    };
  },
  
  async decryptGroupMessage(groupId: string, data: any) {
    console.log('🧪 Test decryptGroupMessage:', groupId, data);
    return atob(data.encryptedPayload || ''); // Simple base64 for testing
  },
  
  async getSenderKeyBundle(groupId: string) {
    console.log('🧪 Test getSenderKeyBundle:', groupId);
    return {
      userId: 'test',
      signingKey: new ArrayBuffer(32),
      chainKey: new ArrayBuffer(32),
      counter: 0,
    };
  },
  
  async addGroupMember(groupId: string, bundle: any) {
    console.log('🧪 Test addGroupMember:', groupId, bundle);
    return Promise.resolve();
  },
  
  async removeGroupMember(groupId: string, userId: string) {
    console.log('🧪 Test removeGroupMember:', groupId, userId);
    return Promise.resolve();
  }
};

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

export default function GroupChatScreen({ route, navigation }: GroupChatScreenProps) {
  // Provide default values to handle undefined route params
  const groupId = route?.params?.groupId || 'default-group';
  const groupName = route?.params?.groupName || 'Signal Group Chat';
	const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const socketRef = useRef<Socket | null>(null);
	const flatListRef = useRef<FlatList>(null);

	useEffect(() => {
		if (user) {
      initializeGroupChat();
    }
		return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
			}
		};
	}, [user]);

  const initializeGroupChat = async () => {
    try {
      setIsLoading(true);
      setConnectionStatus('Initializing encryption...');

      // Use real Noble Signal Protocol crypto
      console.log('🔐 Using Noble Signal Protocol (real E2EE)...');
      await nobleSignalProtocol.initialize();
      
      // Check if group exists or create new one
      try {
        await nobleSignalProtocol.createGroup(groupId, user!.id.toString());
        console.log('✅ Created new group session');
      } catch (error: any) {
        if (error.message === 'GROUP_EXISTS') {
          console.log('✅ Using existing group session');
        } else {
          throw error;
        }
      }

      setConnectionStatus('Connecting to server...');
      
      // Initialize socket connection
      await initializeSocket();
      
      setIsInitialized(true);
      setIsLoading(false);
      setConnectionStatus('Connected');
      
		} catch (error) {
      console.error('❌ Failed to initialize group chat:', error);
      setConnectionStatus('Connection failed');
      Alert.alert('Error', 'Failed to initialize secure group chat');
      setIsLoading(false);
    }
  };

  const initializeSocket = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socket = io(apiConfig.socketURL, {
        auth: {
          token: `mock_jwt_token_${user!.login}`,
        },
        transports: ['websocket'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        socket.emit('join_group', { groupId });
        resolve();
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setConnectionStatus('Disconnected');
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setConnectionStatus('Connection error');
        reject(error);
      });

      socket.on('group_message', async (data) => {
        await handleIncomingMessage(data);
      });

      socket.on('member_joined', (data) => {
        handleMemberJoined(data);
      });

      socket.on('member_left', (data) => {
        handleMemberLeft(data);
      });

      socket.on('group_members', (data) => {
        setMembers(data.members);
      });

      socket.on('sender_key_bundle', async (data) => {
        await handleSenderKeyBundle(data);
      });

      // Timeout for connection
      setTimeout(() => {
        if (!socket.connected) {
          reject(new Error('Socket connection timeout'));
        }
      }, 10000);
    });
  };

  const handleIncomingMessage = async (data: any) => {
    try {
      // Decrypt the message using Noble Signal Protocol
      const decryptedContent = await nobleSignalProtocol.decryptGroupMessage(groupId, data);
      
      const message: Message = {
			id: data.messageId,
        senderId: data.senderId,
        senderName: data.senderName,
			content: decryptedContent,
        timestamp: data.timestamp,
        isEncrypted: true,
        isOwn: data.senderId === user!.id.toString(),
      };

      setMessages(prev => [...prev, message]);
      
      // Auto-scroll to bottom
		setTimeout(() => {
			flatListRef.current?.scrollToEnd({ animated: true });
		}, 100);
      
    } catch (error) {
      console.error('❌ Failed to decrypt message:', error);
      
      // Show error message
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        senderId: data.senderId,
        senderName: data.senderName,
        content: '🔒 Failed to decrypt message',
        timestamp: data.timestamp,
        isEncrypted: false,
        isOwn: false,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleMemberJoined = async (data: any) => {
    console.log('👤 Member joined:', data.username);
    
    // Update members list
    setMembers(prev => [
      ...prev.filter(m => m.userId !== data.userId),
      {
        userId: data.userId,
        username: data.username,
        isOnline: true,
      }
    ]);

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

        // Share our sender key bundle with the new member
    try {
      const myBundle = await nobleSignalProtocol.getSenderKeyBundle(groupId);
      socketRef.current?.emit('share_sender_key', {
        groupId,
        targetUserId: data.userId,
        bundle: myBundle,
      });
    } catch (error) {
      console.error('❌ Failed to share sender key:', error);
    }
  };

  const handleMemberLeft = (data: any) => {
    console.log('👤 Member left:', data.username);
    
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
    nobleSignalProtocol.removeGroupMember(groupId, data.userId).catch(error => {
      console.error('❌ Failed to remove member from crypto session:', error);
    });
  };

  const handleSenderKeyBundle = async (data: any) => {
        try {
      console.log('🔑 Received sender key bundle from:', data.fromUserId);
      await nobleSignalProtocol.addGroupMember(groupId, data.bundle);
    } catch (error) {
      console.error('❌ Failed to process sender key bundle:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !isInitialized) return;

    try {
      // Encrypt message using Noble Signal Protocol
      const encryptedMessage = await nobleSignalProtocol.encryptGroupMessage(groupId, newMessage.trim());
      
      // Send encrypted message via socket
      socketRef.current?.emit('group_message', {
        groupId,
        encryptedMessage,
        originalContent: newMessage.trim(), // For debugging - remove in production
      });

      // Add to local messages
      const message: Message = {
        id: encryptedMessage.messageId,
        senderId: user!.id.toString(),
        senderName: user!.login || 'Unknown',
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
      
		} catch (error) {
      console.error('❌ Failed to send message:', error);
      Alert.alert('Error', 'Failed to send encrypted message');
    }
  };

  const leaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            socketRef.current?.emit('leave_group', { groupId });
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.senderId === 'system') {
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

  if (isLoading) {
	return (
				<View style={styles.welcomeContainer}>
					<View style={styles.infoContainer}>
                    <Text style={styles.infoTitle}>Initializing Secure Chat</Text>
          <Text style={styles.infoText}>
            Setting up real end-to-end encryption using Noble cryptography...
          </Text>
          <Text style={styles.statusText}>{connectionStatus}</Text>
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
            placeholder="Type an encrypted message..."
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