# Random Group Chat with End-to-End Encryption

This backend implementation provides a random group chat system with full end-to-end encryption support, designed to work seamlessly with the existing e2ee frontend.

## 🎯 Concept

The system implements a **"Join Random Group Chat"** feature where:
- Users click one button to join a random group chat
- They get matched with random people in active groups
- All communication is fully end-to-end encrypted
- Groups are created and managed automatically

## 🏗️ Architecture

### Database Schema

```sql
-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  isActive BOOLEAN DEFAULT true,
  maxMembers INTEGER DEFAULT 10,
  currentMembers INTEGER DEFAULT 0,
  isPublic BOOLEAN DEFAULT true,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Group members with e2ee keys
CREATE TABLE group_members (
  id UUID PRIMARY KEY,
  groupId UUID REFERENCES groups(id),
  userId INTEGER REFERENCES users(id),
  role ENUM('admin', 'member') DEFAULT 'member',
  joinedAt TIMESTAMP,
  isActive BOOLEAN DEFAULT true,
  publicKey TEXT, -- Base64 encoded public key for e2ee
  lastSeenAt TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Encrypted messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  groupId UUID REFERENCES groups(id),
  senderId INTEGER REFERENCES users(id),
  encryptedContent TEXT NOT NULL, -- Serialized encrypted message
  messageType ENUM('text', 'system', 'key_exchange'),
  timestamp TIMESTAMP,
  isDelivered BOOLEAN DEFAULT false,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Component Structure

```
backend/src/
├── models/
│   ├── Group.ts           # Group data model
│   ├── GroupMember.ts     # Group membership with e2ee keys
│   ├── Message.ts         # Encrypted message storage
│   └── User.ts           # Existing user model
├── services/
│   ├── GroupService.ts    # Core group logic
│   └── RedisService.ts    # Caching and real-time state
├── controllers/
│   └── GroupController.ts # Socket.IO event handling
├── routes/
│   └── groupRoutes.ts     # HTTP API endpoints
└── migrations/
    ├── 20241201000001-create-groups.js
    ├── 20241201000002-create-group-members.js
    └── 20241201000003-create-messages.js
```

## 🔐 E2EE Integration

### How It Works

1. **Key Exchange**: When joining a group, users provide their public key
2. **Group Keys**: Each group has a shared symmetric key for encryption
3. **Message Flow**: 
   - Frontend encrypts messages using the existing e2ee system
   - Backend stores only encrypted content
   - Other group members decrypt using their keys

### E2EE Compatibility

The backend is fully compatible with the existing frontend e2ee implementation:

```typescript
// Frontend can use existing encryption functions
const encryptedMessage = await encryptGroupMessage(plaintext, groupId);
const result = await sendEncryptedGroupMessage(encryptedMessage, groupId, userId);
```

### API Endpoints for E2EE

```typescript
// Session initialization (e2ee compatibility)
POST /api/users/:userId/sessions
POST /api/messages              // Group messages
POST /api/group-messages        // Explicit group messages
GET  /api/users/:userId/public-key
```

## 🚀 Quick Start

### 1. Run Database Migrations

```bash
npm run migrate
```

### 2. Start the Server

```bash
npm run dev
```

### 3. Test the API

```bash
# Get server status
curl http://localhost:3000/

# Get group statistics
curl http://localhost:3000/api/groups/stats

# Join random group (requires auth token)
curl -X POST http://localhost:3000/api/groups/join-random \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"publicKey": "your_base64_public_key"}'
```

## 📡 Socket.IO Events

### Client → Server Events

```typescript
// Join a random group
socket.emit('join_random_group', {
  publicKey: 'base64_encoded_public_key'
}, (response) => {
  if (response.success) {
    console.log('Joined group:', response.group);
  }
});

// Send encrypted message
socket.emit('send_group_message', {
  groupId: 'group-uuid',
  encryptedMessage: 'serialized_encrypted_message',
  messageType: 'text'
}, (response) => {
  console.log('Message sent:', response);
});

// Leave group
socket.emit('leave_group', {
  groupId: 'group-uuid'
}, (response) => {
  console.log('Left group:', response);
});

// Get message history
socket.emit('get_group_messages', {
  groupId: 'group-uuid',
  limit: 50
}, (response) => {
  console.log('Messages:', response.messages);
});

// Typing indicators
socket.emit('typing_start', { groupId: 'group-uuid' });
socket.emit('typing_stop', { groupId: 'group-uuid' });
```

### Server → Client Events

```typescript
// New user joined
socket.on('user_joined', (data) => {
  console.log('User joined:', data.login);
  // Update group member list
});

// User left
socket.on('user_left', (data) => {
  console.log('User left:', data.login);
});

// New encrypted message
socket.on('new_message', (data) => {
  // Decrypt using frontend e2ee functions
  const decrypted = await decryptMessage(JSON.parse(data.encryptedContent));
  console.log('New message:', decrypted.content);
});

// Typing indicator
socket.on('user_typing', (data) => {
  console.log(`${data.login} is typing:`, data.isTyping);
});

// System messages
socket.on('system_message', (data) => {
  console.log('System:', data.message);
});
```

## 🔧 Integration with Frontend

### Frontend Socket.IO Setup

```typescript
import io from 'socket.io-client';
import { useEncryption } from './hooks/useEncryption';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  }
});

const { encryptGroupMessage, decryptMessage } = useEncryption();

// Join random group
const joinRandomGroup = async () => {
  const identity = await exportIdentity();
  
  socket.emit('join_random_group', {
    publicKey: identity.publicKey
  }, (response) => {
    if (response.success) {
      setCurrentGroup(response.group);
    }
  });
};

// Send message
const sendMessage = async (text: string) => {
  if (!currentGroup) return;
  
  const encrypted = await encryptGroupMessage(text, currentGroup.id);
  
  socket.emit('send_group_message', {
    groupId: currentGroup.id,
    encryptedMessage: JSON.stringify(encrypted)
  });
};

// Receive messages
socket.on('new_message', async (data) => {
  const encryptedMessage = JSON.parse(data.encryptedContent);
  const decrypted = await decryptMessage(encryptedMessage);
  
  addMessageToChat({
    id: data.id,
    content: decrypted.content,
    senderId: data.senderId,
    senderLogin: data.senderLogin,
    timestamp: data.timestamp
  });
});
```

### React Component Example

```tsx
import React, { useState, useEffect } from 'react';
import { useEncryption } from '../hooks/useEncryption';

const RandomGroupChat = () => {
  const [currentGroup, setCurrentGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { initialize, exportIdentity } = useEncryption();

  useEffect(() => {
    initialize('current_user_id');
  }, []);

  const joinRandomGroup = async () => {
    const identity = await exportIdentity();
    
    socket.emit('join_random_group', {
      publicKey: identity.publicKey
    }, (response) => {
      if (response.success) {
        setCurrentGroup(response.group);
      }
    });
  };

  return (
    <div>
      {!currentGroup ? (
        <button onClick={joinRandomGroup}>
          🎲 Join Random Group Chat
        </button>
      ) : (
        <div>
          <h3>{currentGroup.name}</h3>
          <p>Members: {currentGroup.currentMembers}/{currentGroup.maxMembers}</p>
          
          <div className="messages">
            {messages.map(msg => (
              <div key={msg.id}>
                <strong>{msg.senderLogin}:</strong> {msg.content}
              </div>
            ))}
          </div>
          
          <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
          />
        </div>
      )}
    </div>
  );
};
```

## 🔒 Security Features

### End-to-End Encryption
- All messages encrypted with AES-GCM before transmission
- RSA key exchange for group key distribution
- Digital signatures for message authenticity
- Perfect forward secrecy with key rotation

### Group Security
- Random group assignment prevents targeted attacks
- Automatic group cleanup after inactivity
- Public key verification for member authentication
- Rate limiting and abuse prevention

### Data Protection
- No plaintext messages stored in database
- Minimal metadata collection
- Secure session management with Redis
- JWT authentication for API access

## 📊 Monitoring and Analytics

### Group Statistics
```bash
curl http://localhost:3000/api/groups/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "totalGroups": 45,
    "activeGroups": 12,
    "totalMembers": 89,
    "averageGroupSize": 7.42
  }
}
```

### Admin Endpoints
```bash
# Get active groups
GET /api/groups?page=1&limit=20

# Cleanup inactive groups
POST /api/groups/cleanup
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional_password

# JWT
JWT_SECRET=your_secret_key

# Server
PORT=3000
CLIENT_URL=http://localhost:3000
```

### Group Settings
```typescript
// In GroupService.ts
const groupNames = [
  'Random Chat #1', 'Coffee Break', 'Night Owls',
  'Tech Talk', 'Casual Chat', 'Weekend Vibes'
];

const maxMembers = Math.floor(Math.random() * 8) + 3; // 3-10 members
```

## 🚦 API Response Examples

### Join Random Group
```json
{
  "success": true,
  "group": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Coffee Break - 10:30:45 AM",
    "currentMembers": 3,
    "maxMembers": 8,
    "members": [
      {
        "userId": 1,
        "login": "alice",
        "publicKey": "base64_encoded_key",
        "joinedAt": "2024-12-01T10:30:45Z"
      }
    ]
  },
  "message": "Successfully joined group"
}
```

### Send Message Response
```json
{
  "success": true,
  "messageId": "456e7890-e89b-12d3-a456-426614174001",
  "timestamp": "2024-12-01T10:31:23Z"
}
```

## 🎯 Future Enhancements

### Planned Features
- [ ] Group themes and categories
- [ ] Voice/video chat integration
- [ ] File sharing with e2ee
- [ ] Advanced matching algorithms
- [ ] User preferences and filters
- [ ] Moderation tools
- [ ] Message reactions
- [ ] Group invitations

### Scaling Considerations
- [ ] Message sharding by group
- [ ] Redis cluster for high availability
- [ ] Database read replicas
- [ ] CDN for static assets
- [ ] Load balancing for Socket.IO
- [ ] Horizontal scaling with session affinity

This implementation provides a solid foundation for random group chat with full e2ee support, ready for production deployment and further enhancement. 