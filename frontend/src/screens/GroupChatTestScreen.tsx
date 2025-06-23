import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, TextInput, ScrollView, Alert, SafeAreaView } from 'react-native';
import { socket, connectWithAuth, disconnect } from '../api/socket';
import { useAuth } from '../hooks/useAuth';
import { useExpoCompatibleEncryption } from '../hooks/useExpoCompatibleEncryption';
import { EncryptedMessage } from '../crypto/expoCompatibleCrypto';
import styles from './GroupChatTestScreen.style';
import colors from '../css/colors';

interface Message {
    id: string;
    content: string;
    senderLogin: string;
    timestamp: Date;
    isOwn: boolean;
}

interface GroupInfo {
    id: string;
    name: string;
    currentMembers: number;
    maxMembers: number;
}

export default function GroupChatTestScreen({ navigation }: any) {
    const { user, isAuthenticated } = useAuth();
    const { encryptGroupMessage, decryptGroupMessage, initialize, initialized, createGroupSession } = useExpoCompatibleEncryption();
    const [isConnected, setIsConnected] = useState(false);
    const [transport, setTransport] = useState("N/A");
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [currentGroup, setCurrentGroup] = useState<GroupInfo | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    // Initialize encryption when component mounts
    useEffect(() => {
        if (isAuthenticated && user && !initialized) {
            initialize(user.id.toString());
        }
    }, [isAuthenticated, user, initialized, initialize]);

    useEffect(() => {
        function onConnect() {
            console.log("✅ Connected to server");
            setIsConnected(true);
            setConnectionError(null);
            setIsConnecting(false);
            if (socket.io && socket.io.engine) {
                setTransport(socket.io.engine.transport.name);
                
                socket.io.engine.on("upgrade", () => {
                    setTransport(socket.io.engine.transport.name);
                });
            }
        }

        function onDisconnect() {
            console.log("❌ Disconnected from server");
            setIsConnected(false);
            setIsConnecting(false);
            setCurrentGroup(null);
            setMessages([]);
        }

        function onConnectError(error: any) {
            console.error("🚨 Connection error:", error);
            setIsConnected(false);
            setIsConnecting(false);
            setConnectionError(error.message || "Failed to connect to server");
        }

        async function onGroupJoined(data: any) {
            console.log("🎉 Joined group:", data);
            setCurrentGroup(data.group);
            setIsJoining(false);
            
            // Automatically establish group encryption session
            if (initialized && data.group?.id) {
                try {
                    console.log("🔐 Setting up group encryption session...");
                    // Extract member IDs from group data - in a real app this would come from the server
                    const memberIds = data.group.members?.map((member: any) => member.userId?.toString() || member.id?.toString()) || [];
                    await createGroupSession(data.group.id, memberIds);
                    console.log("✅ Group encryption session established");
                } catch (error) {
                    console.error("❌ Failed to setup group encryption session:", error);
                }
            }
        }

        async function onNewMessage(data: any) {
            console.log("📨 New message received:", data);
            
            let messageContent = "[Unable to decrypt]";
            
            try {
                if (data.encryptedContent && initialized) {
                    // Try to decrypt the message
                    const encryptedMessage: EncryptedMessage = JSON.parse(data.encryptedContent);
                    const decryptedMessage = await decryptGroupMessage(encryptedMessage);
                    messageContent = decryptedMessage.content;
                } else {
                    // Fallback to plain text if encryption not available
                    messageContent = data.encryptedContent || data.content || "[No content]";
                }
            } catch (error) {
                console.error("Failed to decrypt message:", error);
                messageContent = "[Encrypted message - decryption failed]";
            }
            
            const newMsg: Message = {
                id: data.id || `msg_${Date.now()}`,
                content: messageContent,
                senderLogin: data.senderLogin,
                timestamp: new Date(data.timestamp),
                isOwn: false
            };
            setMessages(prev => [...prev, newMsg]);
        }

        function onUserJoined(data: any) {
            console.log("👋 User joined:", data);
            const systemMessage: Message = {
                id: `system_${Date.now()}`,
                content: `${data.login} joined the group`,
                senderLogin: "System",
                timestamp: new Date(),
                isOwn: false
            };
            setMessages(prev => [...prev, systemMessage]);
        }

        function onUserLeft(data: any) {
            console.log("👋 User left:", data);
            const systemMessage: Message = {
                id: `system_${Date.now()}`,
                content: `${data.login} left the group`,
                senderLogin: "System",
                timestamp: new Date(),
                isOwn: false
            };
            setMessages(prev => [...prev, systemMessage]);
        }

        // Set up event listeners
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);
        socket.on('group_joined', onGroupJoined);
        socket.on('new_message', onNewMessage);
        socket.on('user_joined', onUserJoined);
        socket.on('user_left', onUserLeft);

        // Check if already connected
        if (socket.connected) {
            onConnect();
        }

        // Check authentication and connect if authenticated
        if (isAuthenticated && !isConnected && !isConnecting) {
            handleConnect();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            socket.off('group_joined', onGroupJoined);
            socket.off('new_message', onNewMessage);
            socket.off('user_joined', onUserJoined);
            socket.off('user_left', onUserLeft);
        };
    }, [isAuthenticated, isConnected, isConnecting, initialized, decryptGroupMessage]);

    const handleConnect = async () => {
        if (!isAuthenticated) {
            Alert.alert("Authentication Required", "Please log in to use group chat", [
                { text: "OK", onPress: () => navigation.navigate("Login") }
            ]);
            return;
        }

        setIsConnecting(true);
        setConnectionError(null);
        
        const connected = await connectWithAuth();
        if (!connected) {
            setConnectionError("Failed to connect. Please check your authentication.");
            setIsConnecting(false);
        }
    };

    const retryConnection = () => {
        console.log("🔄 Retrying connection...");
        handleConnect();
    };

    const joinRandomGroup = () => {
        if (!isConnected) {
            Alert.alert("Error", "Not connected to server");
            return;
        }

        setIsJoining(true);
        
        socket.emit("join_random_group", {
            publicKey: null // No encryption for simple test
        }, (response: any) => {
            if (!response || !response.success) {
                Alert.alert("Error", response?.message || "Failed to join group");
                setIsJoining(false);
            }
            // Success is handled by the 'group_joined' event
        });
    };

    const sendMessage = async () => {
        if (!isConnected || !currentGroup || !newMessage.trim()) {
            return;
        }

        // SECURITY: Only allow encrypted messages
        if (!initialized) {
            Alert.alert(
                "Encryption Required", 
                "Messages can only be sent when end-to-end encryption is active. Please wait for encryption to initialize.",
                [{ text: "OK" }]
            );
            return;
        }

        try {
            // Add message to local state immediately (optimistic update)
            const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const localMessage: Message = {
                id: messageId,
                content: newMessage,
                senderLogin: user?.id.toString() || "Unknown",
                timestamp: new Date(),
                isOwn: true
            };
            setMessages(prev => [...prev, localMessage]);
            
            // SECURITY: Always encrypt - no fallback to plain text
            let encryptedMessageString: string;
            try {
                const encryptedMessage = await encryptGroupMessage(newMessage, currentGroup.id, user?.id.toString() || "unknown");
                encryptedMessageString = JSON.stringify(encryptedMessage);
                console.log("✅ Message encrypted successfully");
            } catch (encryptError) {
                console.error("❌ Encryption failed:", encryptError);
                // Remove the optimistic message on encryption failure
                setMessages(prev => prev.filter(msg => msg.id !== messageId));
                Alert.alert(
                    "Encryption Failed", 
                    "Unable to encrypt your message. For security reasons, unencrypted messages are not allowed.",
                    [{ text: "OK" }]
                );
                return;
            }
            
            // Send encrypted message to server
            socket.emit("send_group_message", {
                groupId: currentGroup.id,
                encryptedMessage: encryptedMessageString,
                messageType: "text"
            }, (response: any) => {
                if (!response || !response.success) {
                    console.error("❌ Failed to send message:", response?.message);
                    // Remove the optimistic message on failure
                    setMessages(prev => prev.filter(msg => msg.id !== messageId));
                    Alert.alert("Error", "Failed to send message to server");
                }
            });
            
            setNewMessage("");
        } catch (error) {
            console.error("❌ Error sending message:", error);
            Alert.alert("Error", "Failed to send message");
        }
    };

    const leaveGroup = () => {
        if (!isConnected || !currentGroup) return;
        
        socket.emit("leave_group", {
            groupId: currentGroup.id
        }, (response: any) => {
            if (response && response.success) {
                setCurrentGroup(null);
                setMessages([]);
            }
        });
    };

    const getConnectionStatusText = () => {
        if (connectionError) return `Error: ${connectionError}`;
        if (isConnecting) return 'Connecting...';
        if (isConnected) return 'Connected';
        return 'Disconnected';
    };

    const getJoinButtonText = () => {
        if (connectionError) return 'Retry Connection';
        if (isConnecting) return 'Connecting...';
        if (isJoining) return 'Joining...';
        if (!isConnected) return 'Not Connected';
        return 'Join Random Group';
    };

    const handleJoinButtonPress = () => {
        if (connectionError || !isConnected) {
            retryConnection();
        } else {
            joinRandomGroup();
        }
    };

    // Authentication check
    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Group Chat</Text>
                    <Text style={styles.subtitle}>Authentication Required</Text>
                </View>
                <View style={styles.authContainer}>
                    <Text style={styles.authTitle}>Please log in to continue</Text>
                    <Text style={styles.authSubtitle}>
                        You need to be authenticated to access group chat features.
                    </Text>
                    <TouchableOpacity 
                        style={styles.authButton} 
                        onPress={() => navigation.navigate("Login")}
                    >
                        <Text style={styles.authButtonText}>Go to Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.authSecondaryButton} 
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.authSecondaryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Group Chat</Text>
                <View style={styles.headerInfo}>
                    <View style={styles.connectionStatus}>
                        <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
                        <Text style={styles.statusText}>{getConnectionStatusText()}</Text>
                    </View>
                    <View style={styles.encryptionStatus}>
                        <View style={[styles.statusDot, initialized ? styles.connected : styles.disconnected]} />
                        <Text style={styles.statusText}>
                            {initialized ? "Encrypted" : "Initializing..."}
                        </Text>
                    </View>
                    {currentGroup && (
                        <Text style={styles.groupInfo}>
                            {currentGroup.name} ({currentGroup.currentMembers}/{currentGroup.maxMembers})
                        </Text>
                    )}
                </View>
                {currentGroup && (
                    <TouchableOpacity style={styles.leaveButton} onPress={leaveGroup}>
                        <Text style={styles.leaveButtonText}>Leave Group</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.content}>
                {!currentGroup ? (
                    <View style={styles.joinContainer}>
                        <Text style={styles.joinTitle}>Welcome to Group Chat</Text>
                        <Text style={styles.joinSubtitle}>
                            Connect with others in real-time group conversations with end-to-end encryption.
                        </Text>
                        <TouchableOpacity 
                            style={[styles.joinButton, (isJoining || isConnecting) && styles.joinButtonDisabled]} 
                            onPress={handleJoinButtonPress}
                            disabled={isJoining || isConnecting}
                        >
                            <Text style={styles.joinButtonText}>
                                {getJoinButtonText()}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.chatContainer}>
                        <ScrollView 
                            style={styles.messagesContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            {messages.map((message) => (
                                <View 
                                    key={message.id} 
                                    style={[
                                        styles.messageContainer,
                                        message.isOwn ? styles.ownMessage : styles.otherMessage
                                    ]}
                                >
                                    <Text style={[
                                        styles.senderName,
                                        message.isOwn && styles.ownSenderName
                                    ]}>
                                        {message.senderLogin}
                                    </Text>
                                    <Text style={[
                                        styles.messageText,
                                        message.isOwn ? styles.ownMessageText : styles.otherMessageText
                                    ]}>
                                        {message.content}
                                    </Text>
                                    <Text style={[
                                        styles.messageTime,
                                        message.isOwn && styles.ownMessageTime
                                    ]}>
                                        {message.timestamp.toLocaleTimeString()}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.inputContainer}>
                            <View style={styles.messageInputWrapper}>
                                <TextInput
                                    style={styles.messageInput}
                                    value={newMessage}
                                    onChangeText={setNewMessage}
                                    placeholder={
                                        initialized 
                                            ? "Type a message..." 
                                            : "Waiting for encryption..."
                                    }
                                    placeholderTextColor={colors.text + "50"}
                                    multiline
                                    maxLength={500}
                                    editable={initialized}
                                />
                                {!initialized && (
                                    <View style={styles.encryptionWarning}>
                                        <Text style={styles.encryptionWarningText}>
                                            🔒 Initializing encryption...
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity 
                                style={[
                                    styles.sendButton, 
                                    (!newMessage.trim() || !initialized) && styles.sendButtonDisabled
                                ]}
                                onPress={sendMessage}
                                disabled={!newMessage.trim() || !initialized}
                            >
                                <Text style={styles.sendButtonText}>→</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}