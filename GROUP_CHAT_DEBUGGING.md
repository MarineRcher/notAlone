# Group Chat Debugging Guide

## Issue: No Messages Appear When Joining Group & No Welcome Message

### 🔍 Potential Causes and Solutions

#### 1. **Socket Connection Issues**

**Check if socket is properly connected:**
```javascript
// In browser console or React Native debugger
console.log("Socket connected:", socket.connected);
console.log("Socket ID:", socket.id);
```

**Common issues:**
- JWT token expired or invalid
- Network connectivity problems
- Server not running on expected port

**Solution:**
```javascript
// Check authentication
const token = await authHelpers.getValidToken();
console.log("Token valid:", !!token);

// Reconnect if needed
if (!socket.connected) {
  await connectWithAuth();
}
```

#### 2. **Event Listener Registration**

**Check if event listeners are properly set up:**
```javascript
// Add this to setupSocketListeners()
console.log("🔧 Setting up socket listeners...");
socket.on("group_message", (data) => {
  console.log("📨 group_message event received:", data);
  handleIncomingMessage(data);
});
```

**Common issues:**
- Listeners set up before socket connection
- Listeners removed during component lifecycle
- Wrong event names

#### 3. **Group Join Process**

**Check the join process step by step:**

```javascript
// 1. Check if user has valid key pair
const userKeyPair = await groupChatCrypto.getUserKeyPair();
console.log("User key pair:", userKeyPair ? "✅ Found" : "❌ Not found");

// 2. Check join_random_group emission
socket.emit("join_random_group", {
  publicKey: userKeyPair.publicKey
});
console.log("✅ join_random_group event emitted");

// 3. Check if joined_random_group event is received
socket.on("joined_random_group", (data) => {
  console.log("🎉 joined_random_group event received:", data);
});
```

#### 4. **Welcome Message Issues**

**Check backend welcome message generation:**

```javascript
// In backend E2EESocketService.ts
private async sendWelcomeMessage(groupId: string, memberIds: string[]): Promise<void> {
  console.log(`📢 Sending welcome message to group ${groupId} with ${memberIds.length} members`);
  
  // Check if message is being stored
  const { id: messageId } = await this.groupService.storeMessage(
    groupId, 
    systemSenderId,
    systemMessage
  );
  console.log("✅ Welcome message stored with ID:", messageId);
  
  // Check if broadcast is working
  const room = `group:${groupId}`;
  const connectedSockets = await this.io.in(room).fetchSockets();
  console.log(`📊 Group ${groupId} has ${connectedSockets.length} connected sockets`);
}
```

#### 5. **Crypto Initialization Issues**

**Check if crypto is properly initialized:**

```javascript
// In frontend
const initializeCrypto = async () => {
  try {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }
    
    console.log("🔐 Initializing crypto for user:", user.id);
    await groupChatCrypto.initializeUser(user.id.toString());
    
    // Verify initialization
    const userKeyPair = await groupChatCrypto.getUserKeyPair();
    console.log("✅ Crypto initialized:", !!userKeyPair);
  } catch (error) {
    console.error("❌ Crypto initialization failed:", error);
  }
};
```

#### 6. **Message Decryption Issues**

**Check if messages are being decrypted properly:**

```javascript
const handleIncomingMessage = async (data) => {
  console.log("📨 Received message:", data);
  
  try {
    // Check if it's a system message
    if (data.senderUsername === 'Système' || encryptedMessage.keyVersion === 0) {
      console.log("📢 Processing system message");
      // Handle system message
      return;
    }
    
    // Check if group key exists
    const groupKeyInfo = await groupChatCrypto.getGroupKey(data.groupId);
    console.log("🔑 Group key found:", !!groupKeyInfo);
    
    // Try to decrypt
    const decryptedContent = await groupChatCrypto.decryptMessage(
      data.groupId,
      encryptedMessage
    );
    console.log("✅ Message decrypted:", decryptedContent);
  } catch (error) {
    console.error("❌ Decryption failed:", error);
  }
};
```

#### 7. **Database Issues**

**Check if messages are being stored:**

```sql
-- Check if messages exist in database
SELECT * FROM messages WHERE group_id = 'your-group-id' ORDER BY created_at DESC LIMIT 10;

-- Check if group exists
SELECT * FROM groups WHERE id = 'your-group-id';
```

#### 8. **Room Management Issues**

**Check if users are properly joined to socket rooms:**

```javascript
// In backend
private onGroupCreated(group: GroupSession): void {
  group.members.forEach(member => {
    const memberSocket = this.findSocketByUserId(member.userId);
    
    if (memberSocket) {
      // Check if user is joining the room
      memberSocket.join(`group:${group.groupId}`);
      console.log(`✅ User ${member.userId} joined room group:${group.groupId}`);
      
      // Verify room membership
      const room = this.io.sockets.adapter.rooms.get(`group:${group.groupId}`);
      console.log(`📊 Room ${group.groupId} has ${room?.size || 0} members`);
    }
  });
}
```

### 🛠️ Debugging Steps

#### Step 1: Check Console Logs
1. Open browser console or React Native debugger
2. Look for socket connection logs
3. Check for event emission/reception logs
4. Look for crypto initialization logs

#### Step 2: Verify Socket Connection
```javascript
// Add this to your component
useEffect(() => {
  console.log("🔌 Socket status:", {
    connected: socket.connected,
    id: socket.id,
    transport: socket.io?.engine?.transport?.name
  });
}, [socket.connected]);
```

#### Step 3: Test Event Flow
```javascript
// Test basic socket communication
socket.emit("test_event", { message: "Hello" });
socket.on("test_response", (data) => {
  console.log("✅ Test response received:", data);
});
```

#### Step 4: Check Backend Logs
Look for these logs in your backend console:
- `🔗 Setting up event handlers for socket`
- `🎯 Received join_random_group event`
- `🚀 Setting up group`
- `📢 Sending welcome message`
- `📡 Broadcasting group_message`

#### Step 5: Verify Group Creation
```javascript
// Check if group is actually created
const group = this.groupService.getGroupSession(groupId);
console.log("Group exists:", !!group);
console.log("Group members:", group?.members?.length);
```

### 🚨 Common Fixes

#### Fix 1: Ensure Proper Event Order
```javascript
// Make sure listeners are set up AFTER connection
const setupSocketConnection = async () => {
  const connected = await connectWithAuth();
  if (connected) {
    setIsConnected(true);
    setupSocketListeners(); // Set up listeners AFTER connection
  }
};
```

#### Fix 2: Add Error Boundaries
```javascript
socket.on("error", (error) => {
  console.error("❌ Socket error:", error);
  Alert.alert("Erreur de connexion", error.message);
});
```

#### Fix 3: Verify Crypto Setup
```javascript
// Ensure crypto is initialized before joining group
const joinRandomGroup = async () => {
  try {
    // Initialize crypto first
    await groupChatCrypto.initializeUser(user.id.toString());
    
    // Then join group
    const userKeyPair = await groupChatCrypto.getUserKeyPair();
    socket.emit("join_random_group", {
      publicKey: userKeyPair.publicKey
    });
  } catch (error) {
    console.error("❌ Join failed:", error);
  }
};
```

#### Fix 4: Check Message Format
```javascript
// Ensure message format matches expected structure
const systemMessage = {
  content: "Welcome message",
  keyVersion: 0, // System messages use keyVersion 0
  timestamp: new Date(),
  senderId: "system"
};
```

### 📋 Debugging Checklist

- [ ] Socket connected successfully
- [ ] JWT token valid and not expired
- [ ] Event listeners properly registered
- [ ] Crypto initialized for user
- [ ] User key pair generated
- [ ] join_random_group event emitted
- [ ] joined_random_group event received
- [ ] Group created in backend
- [ ] User joined socket room
- [ ] Welcome message generated
- [ ] Welcome message stored in database
- [ ] Welcome message broadcasted
- [ ] group_message event received on frontend
- [ ] Message decrypted successfully
- [ ] Message added to UI state

### 🔧 Quick Test

Run this test to verify basic functionality:

```javascript
// Test script
const testGroupChat = async () => {
  console.log("🧪 Starting group chat test...");
  
  // 1. Check connection
  console.log("🔌 Socket connected:", socket.connected);
  
  // 2. Check crypto
  const userKeyPair = await groupChatCrypto.getUserKeyPair();
  console.log("🔐 Crypto ready:", !!userKeyPair);
  
  // 3. Join group
  socket.emit("join_random_group", {
    publicKey: userKeyPair.publicKey
  });
  
  // 4. Listen for events
  socket.on("joined_random_group", (data) => {
    console.log("✅ Group joined:", data);
  });
  
  socket.on("group_message", (data) => {
    console.log("📨 Message received:", data);
  });
  
  socket.on("error", (error) => {
    console.error("❌ Error:", error);
  });
};

testGroupChat();
```

This debugging guide should help you identify and fix the issue with messages not appearing when joining a group. 