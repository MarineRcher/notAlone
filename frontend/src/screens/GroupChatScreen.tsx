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
import { CryptoAPI } from '../crypto';

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
  const [pendingMessages, setPendingMessages] = useState<Map<string, any>>(new Map());
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

  // Clean up old pending messages (older than 5 minutes)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setPendingMessages(prev => {
        const newMap = new Map(prev);
        let removed = 0;
        
        newMap.forEach((messageData, pendingId) => {
          if (now - messageData.timestamp > 5 * 60 * 1000) { // 5 minutes
            newMap.delete(pendingId);
            removed++;
          }
        });
        
        if (removed > 0) {
          console.log(`🧹 Cleaned up ${removed} old pending messages`);
        }
        
        return newMap;
      });
    }, 60000); // Check every minute

    return () => clearInterval(cleanup);
  }, []);

  const initializeGroupChat = async () => {
    try {
      console.log('🔑 [KEY EXCHANGE] ===== INITIALIZING GROUP CHAT =====');
      console.log('🔑 [KEY EXCHANGE] User ID:', user!.id.toString());
      console.log('🔑 [KEY EXCHANGE] Group ID:', groupId);
      
      setIsLoading(true);
      setConnectionStatus('Initializing encryption...');

      // Use real Noble Signal Protocol crypto
      console.log('🔐 Using Noble Signal Protocol (real E2EE)...');
      console.log('🔑 [KEY EXCHANGE] Initializing crypto API...');
      await CryptoAPI.initialize();
      console.log('🔑 [KEY EXCHANGE] ✅ Crypto API initialized');
      
      // Check if group exists or create new one
      try {
        console.log('🔑 [KEY EXCHANGE] Creating/joining group session...');
        await CryptoAPI.createGroup(groupId, user!.id.toString());
        console.log('🔑 [KEY EXCHANGE] ✅ Created new group session');
      } catch (error: any) {
        if (error.message === 'GROUP_EXISTS') {
          console.log('🔑 [KEY EXCHANGE] ✅ Using existing group session');
        } else {
          console.error('🔑 [KEY EXCHANGE] ❌ Group creation error:', error);
          throw error;
        }
      }

      setConnectionStatus('Connecting to server...');
      
      // Initialize socket connection
      console.log('🔑 [KEY EXCHANGE] Initializing socket connection...');
      await initializeSocket();
      console.log('🔑 [KEY EXCHANGE] ✅ Socket connection established');
      
      setIsInitialized(true);
      setIsLoading(false);
      setConnectionStatus('Connected');
      console.log('🔑 [KEY EXCHANGE] ===== GROUP CHAT INITIALIZATION COMPLETE =====');
      
		} catch (error) {
      console.error('🔑 [KEY EXCHANGE] ❌ Failed to initialize group chat:', error);
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

      socket.on('request_sender_key', async (data) => {
        await handleSenderKeyRequest(data);
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
      // Check if we have the sender's key - if not, request it
      if (data.senderId !== user!.id.toString()) {
        try {
          // Convert Base64 strings back to ArrayBuffers for decryption
          const deserializedMessage = {
            ...data,
            encryptedPayload: new Uint8Array(atob(data.encryptedPayload).split('').map(c => c.charCodeAt(0))).buffer,
            signature: new Uint8Array(atob(data.signature).split('').map(c => c.charCodeAt(0))).buffer,
          };
          
          // Try to decrypt the message using Noble Signal Protocol
          const decryptedContent = await CryptoAPI.receiveGroupMessage(groupId, deserializedMessage);
          
          const message: Message = {
            id: data.messageId,
            senderId: data.senderId,
            senderName: data.senderName,
            content: decryptedContent,
            timestamp: data.timestamp,
            isEncrypted: true,
            isOwn: false,
          };

          setMessages(prev => [...prev, message]);
          
          // Auto-scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
          
        } catch (decryptError: any) {
          console.error('❌ Failed to decrypt message - missing sender key:', decryptError);
          
          console.log('🔑 [KEY EXCHANGE] ===== MESSAGE DECRYPT FAILED - REQUESTING KEY =====');
          console.log('🔑 [KEY EXCHANGE] Message from:', data.senderId);
          console.log('🔑 [KEY EXCHANGE] Message ID:', data.messageId);
          console.log('🔑 [KEY EXCHANGE] Decrypt error:', decryptError.message);
          
          // Store the encrypted message data for later decryption
          const pendingId = `pending_${data.senderId}_${data.timestamp}`;
          console.log('🔑 [KEY EXCHANGE] Storing message as pending:', pendingId);
          
          setPendingMessages(prev => {
            const newMap = new Map(prev);
            newMap.set(pendingId, data);
            console.log('🔑 [KEY EXCHANGE] Total pending messages:', newMap.size);
            return newMap;
          });
          
          // Request sender key from the sender
          console.log('🔑 [KEY EXCHANGE] Requesting sender key from:', data.senderId);
          socketRef.current?.emit('request_sender_key', {
            groupId,
            fromUserId: data.senderId,
          });
          console.log('🔑 [KEY EXCHANGE] ✅ Key request sent to backend');
          
          // Show pending message
          const pendingMessage: Message = {
            id: pendingId,
            senderId: data.senderId,
            senderName: data.senderName,
            content: '🔄 Waiting for decryption key...',
            timestamp: data.timestamp,
            isEncrypted: false,
            isOwn: false,
          };
          
          setMessages(prev => [...prev, pendingMessage]);
          console.log('🔑 [KEY EXCHANGE] ===== PENDING MESSAGE CREATED =====');
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to process incoming message:', error);
      
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
    console.log('🔑 [KEY EXCHANGE] New member joined - initiating key share');
    console.log('🔑 [KEY EXCHANGE] Target member:', {
      userId: data.userId,
      username: data.username,
      myUserId: user!.id.toString()
    });
    
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
      console.log('🔑 [KEY EXCHANGE] Generating sender key bundle for new member...');
      const myBundle = await CryptoAPI.getSenderKeyBundle(groupId);
      console.log('🔑 [KEY EXCHANGE] Generated bundle:', {
        hasBundle: !!myBundle,
        bundleKeys: myBundle ? Object.keys(myBundle) : null,
        groupId: groupId
      });
      
      // Serialize ArrayBuffers in the bundle
      const serializedBundle = {
        ...myBundle,
        signingKey: btoa(String.fromCharCode(...new Uint8Array(myBundle.signingKey))),
        chainKey: btoa(String.fromCharCode(...new Uint8Array(myBundle.chainKey))),
      };
      
      console.log('🔑 [KEY EXCHANGE] Emitting share_sender_key event...');
      socketRef.current?.emit('share_sender_key', {
        groupId,
        targetUserId: data.userId,
        bundle: serializedBundle,
      });
      console.log('🔑 [KEY EXCHANGE] ✅ Key share event sent to backend for user:', data.userId);
      
    } catch (error: any) {
      console.error('🔑 [KEY EXCHANGE] ❌ Failed to share sender key:', error);
      console.error('🔑 [KEY EXCHANGE] Error details:', {
        message: error.message,
        stack: error.stack,
        targetUserId: data.userId
      });
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
    CryptoAPI.removeGroupMember(groupId, data.userId).catch((error: any) => {
      console.error('❌ Failed to remove member from crypto session:', error);
    });
  };

  const handleSenderKeyBundle = async (data: any) => {
    try {
      console.log('🔑 [KEY EXCHANGE] ===== RECEIVED SENDER KEY BUNDLE =====');
      console.log('🔑 [KEY EXCHANGE] From user:', data.fromUserId);
      console.log('🔑 [KEY EXCHANGE] Group ID:', data.groupId);
      console.log('🔑 [KEY EXCHANGE] Bundle data:', {
        hasBundle: !!data.bundle,
        bundleKeys: data.bundle ? Object.keys(data.bundle) : null,
        bundleValues: data.bundle ? Object.keys(data.bundle).reduce((acc, key) => {
          acc[key] = typeof data.bundle[key];
          return acc;
        }, {} as any) : null
      });
      
      // Deserialize ArrayBuffers from the bundle
      const deserializedBundle = {
        ...data.bundle,
        signingKey: new Uint8Array(atob(data.bundle.signingKey).split('').map(c => c.charCodeAt(0))).buffer,
        chainKey: new Uint8Array(atob(data.bundle.chainKey).split('').map(c => c.charCodeAt(0))).buffer,
      };
      
      console.log('🔑 [KEY EXCHANGE] Adding group member to crypto system...');
      await CryptoAPI.addGroupMember(groupId, deserializedBundle);
      console.log('🔑 [KEY EXCHANGE] ✅ Successfully added group member to crypto system');
      
      // Check how many pending messages we have for this sender
      const pendingCount = Array.from(pendingMessages.entries()).filter(([_, msgData]) => 
        msgData.senderId === data.fromUserId
      ).length;
      console.log('🔑 [KEY EXCHANGE] Found', pendingCount, 'pending messages from this sender');
      
      // Try to decrypt any pending messages from this sender
      if (pendingCount > 0) {
        console.log('🔑 [KEY EXCHANGE] Attempting to decrypt pending messages from:', data.fromUserId);
        await processPendingMessages(data.fromUserId);
      } else {
        console.log('🔑 [KEY EXCHANGE] No pending messages to decrypt');
      }
      
      console.log('🔑 [KEY EXCHANGE] ===== KEY EXCHANGE COMPLETE =====');
      
    } catch (error: any) {
      console.error('🔑 [KEY EXCHANGE] ❌ Failed to process sender key bundle:', error);
      console.error('🔑 [KEY EXCHANGE] Error details:', {
        message: error.message,
        stack: error.stack,
        fromUserId: data.fromUserId,
        hasBundle: !!data.bundle
      });
    }
  };

  const handleSenderKeyRequest = async (data: any) => {
    try {
      console.log('🔑 [KEY EXCHANGE] ===== KEY REQUEST RECEIVED =====');
      console.log('🔑 [KEY EXCHANGE] Requested by user:', data.fromUserId);
      console.log('🔑 [KEY EXCHANGE] Group ID:', data.groupId);
      console.log('🔑 [KEY EXCHANGE] My user ID:', user!.id.toString());
      
      console.log('🔑 [KEY EXCHANGE] Generating my sender key bundle...');
      const myBundle = await CryptoAPI.getSenderKeyBundle(groupId);
      console.log('🔑 [KEY EXCHANGE] Generated bundle:', {
        hasBundle: !!myBundle,
        bundleKeys: myBundle ? Object.keys(myBundle) : null,
        groupId: groupId
      });
      
      // Serialize ArrayBuffers in the bundle
      const serializedBundle = {
        ...myBundle,
        signingKey: btoa(String.fromCharCode(...new Uint8Array(myBundle.signingKey))),
        chainKey: btoa(String.fromCharCode(...new Uint8Array(myBundle.chainKey))),
      };
      
      console.log('🔑 [KEY EXCHANGE] Sending key bundle to requester...');
      socketRef.current?.emit('share_sender_key', {
        groupId,
        targetUserId: data.fromUserId,
        bundle: serializedBundle,
      });
      console.log('🔑 [KEY EXCHANGE] ✅ Key bundle sent to:', data.fromUserId);
      console.log('🔑 [KEY EXCHANGE] ===== KEY REQUEST RESPONSE COMPLETE =====');
      
    } catch (error: any) {
      console.error('🔑 [KEY EXCHANGE] ❌ Failed to share sender key on request:', error);
      console.error('🔑 [KEY EXCHANGE] Error details:', {
        message: error.message,
        stack: error.stack,
        requesterId: data.fromUserId
      });
    }
  };

  const processPendingMessages = async (senderId: string) => {
    console.log('🔑 [KEY EXCHANGE] ===== PROCESSING PENDING MESSAGES =====');
    console.log('🔑 [KEY EXCHANGE] Sender ID:', senderId);
    
    const messagesToProcess: Array<[string, any]> = [];
    
    // Find all pending messages from this sender
    pendingMessages.forEach((messageData, pendingId) => {
      if (messageData.senderId === senderId) {
        messagesToProcess.push([pendingId, messageData]);
      }
    });

    console.log('🔑 [KEY EXCHANGE] Found', messagesToProcess.length, 'messages to process');
    console.log('🔑 [KEY EXCHANGE] Message IDs:', messagesToProcess.map(([id]) => id));

    for (const [pendingId, messageData] of messagesToProcess) {
      try {
        console.log('🔑 [KEY EXCHANGE] Attempting to decrypt pending message:', pendingId);
        console.log('🔑 [KEY EXCHANGE] Message data:', {
          messageId: messageData.messageId as string,
          senderId: messageData.senderId as string,
          timestamp: messageData.timestamp as number,
          hasEncryptedPayload: !!messageData.encryptedPayload
        });
        
        // Convert Base64 strings back to ArrayBuffers for decryption
        const deserializedMessage = {
          ...messageData,
          encryptedPayload: new Uint8Array(atob(messageData.encryptedPayload).split('').map(c => c.charCodeAt(0))).buffer,
          signature: new Uint8Array(atob(messageData.signature).split('').map(c => c.charCodeAt(0))).buffer,
        };
        
        // Try to decrypt the message now that we have the sender key
        const decryptedContent = await CryptoAPI.receiveGroupMessage(groupId, deserializedMessage);
        console.log('🔑 [KEY EXCHANGE] ✅ Successfully decrypted message:', pendingId);
        console.log('🔑 [KEY EXCHANGE] Decrypted content length:', decryptedContent.length);
        
        // Update the message in the UI
        setMessages(prev => prev.map(msg => {
          if (msg.id === pendingId) {
            console.log('🔑 [KEY EXCHANGE] Updating UI message:', pendingId);
            return {
              ...msg,
              content: decryptedContent,
              isEncrypted: true,
            };
          }
          return msg;
        }));
        
        // Remove from pending messages
        setPendingMessages(prev => {
          const newMap = new Map(prev);
          newMap.delete(pendingId);
          console.log('🔑 [KEY EXCHANGE] Removed from pending. Remaining:', newMap.size);
          return newMap;
        });
        
        console.log('🔑 [KEY EXCHANGE] ✅ Message processing complete:', pendingId);
        
      } catch (error: any) {
        console.error('🔑 [KEY EXCHANGE] ❌ Still cannot decrypt message:', pendingId, error);
        console.error('🔑 [KEY EXCHANGE] Decrypt error details:', {
          message: error.message,
          stack: error.stack,
          messageId: messageData.messageId
        });
      }
    }
    
    console.log('🔑 [KEY EXCHANGE] ===== PENDING MESSAGE PROCESSING COMPLETE =====');
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !isInitialized) return;

    try {
      console.log('🔑 [KEY EXCHANGE] ===== SENDING ENCRYPTED MESSAGE =====');
      console.log('🔑 [KEY EXCHANGE] Message length:', newMessage.trim().length);
      console.log('🔑 [KEY EXCHANGE] Group ID:', groupId);
      console.log('🔑 [KEY EXCHANGE] Sender ID:', user!.id.toString());
      
      // Encrypt message using Noble Signal Protocol
      console.log('🔑 [KEY EXCHANGE] Encrypting message...');
      const encryptedMessage = await CryptoAPI.sendGroupMessage(groupId, newMessage.trim());
      console.log('🔑 [KEY EXCHANGE] ✅ Message encrypted successfully');
      console.log('🔑 [KEY EXCHANGE] Encrypted message details:', {
        messageId: encryptedMessage.messageId,
        timestamp: encryptedMessage.timestamp,
        hasEncryptedPayload: !!encryptedMessage.encryptedPayload,
        payloadLength: encryptedMessage.encryptedPayload?.length || 0
      });
      
      // Convert ArrayBuffers to Base64 for transmission
      const serializedMessage = {
        ...encryptedMessage,
        encryptedPayload: btoa(String.fromCharCode(...new Uint8Array(encryptedMessage.encryptedPayload))),
        signature: btoa(String.fromCharCode(...new Uint8Array(encryptedMessage.signature))),
      };

      // Send encrypted message via socket
      console.log('🔑 [KEY EXCHANGE] Sending encrypted message via socket...');
      console.log('🔑 [KEY EXCHANGE] Serialized payload length:', serializedMessage.encryptedPayload.length);
      socketRef.current?.emit('group_message', {
        groupId,
        encryptedMessage: serializedMessage,
      });
      console.log('🔑 [KEY EXCHANGE] ✅ Encrypted message sent to backend');

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
      console.log('🔑 [KEY EXCHANGE] ===== MESSAGE SEND COMPLETE =====');
      
      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
		} catch (error: any) {
      console.error('🔑 [KEY EXCHANGE] ❌ Failed to send message:', error);
      console.error('🔑 [KEY EXCHANGE] Send error details:', {
        message: error.message,
        stack: error.stack
      });
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