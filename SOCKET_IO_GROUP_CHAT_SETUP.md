# Socket.IO Group Chat Setup Guide

## Overview

The backend has been enhanced with **Socket.IO** real-time group chat functionality that seamlessly integrates with the existing e2ee frontend. Users can join random encrypted group chats through a single button click.

## ✨ Key Features

- **Real-time Socket.IO communication** for instant messaging
- **Random group matching** with smart algorithms
- **Full E2EE integration** - backend stores only encrypted content
- **JWT authentication** for all operations
- **Redis caching** for performance (optional)
- **Typing indicators** and presence management
- **Automatic group cleanup** for inactive groups

## 🚀 Quick Start Options

### Option 1: Docker Compose (Recommended)

1. **Create environment file** (`.env` in project root):
```bash
# Database Configuration
POSTGRES_DB=notalone
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432

# API Configuration
API_PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Environment
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

2. **Start the services**:
```bash
docker-compose up -d
```

3. **Access the API**:
- Main API: http://localhost:3000
- Health check: http://localhost:3000/

### Option 2: Local Development (Requires PostgreSQL + Redis)

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Set up PostgreSQL database**:
```sql
CREATE DATABASE notalone;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE notalone TO postgres;
```

3. **Start Redis** (optional):
```bash
redis-server
```

4. **Run the server**:
```bash
npm run dev
```

## 🔌 Socket.IO Events

### Client Events (Frontend → Backend)

#### `join_random_group`
Join or create a random group
```javascript
socket.emit('join_random_group', {
  publicKey: 'user_public_key_base64'
});
```

#### `send_group_message`
Send encrypted message to group
```javascript
socket.emit('send_group_message', {
  groupId: 'group-uuid',
  encryptedMessage: 'serialized_encrypted_content',
  messageType: 'text' // 'text' | 'system' | 'key_exchange'
});
```

#### `leave_group`
Leave current group
```javascript
socket.emit('leave_group', {
  groupId: 'group-uuid'
});
```

#### `typing_start` / `typing_stop`
Typing indicators
```javascript
socket.emit('typing_start', { groupId: 'group-uuid' });
socket.emit('typing_stop', { groupId: 'group-uuid' });
```

### Server Events (Backend → Frontend)

#### `group_joined`
Successfully joined a group
```javascript
socket.on('group_joined', (data) => {
  // data.group contains full group info with members
});
```

#### `new_group_message`
New message received
```javascript
socket.on('new_group_message', (data) => {
  // data contains encrypted message and sender info
});
```

#### `user_joined_group` / `user_left_group`
Member changes
```javascript
socket.on('user_joined_group', (data) => {
  // data contains new member info
});
```

#### `typing_indicator`
Someone is typing
```javascript
socket.on('typing_indicator', (data) => {
  // data.userId, data.login, data.isTyping
});
```

## 🔐 E2EE Integration

The Socket.IO backend is designed to work seamlessly with the existing frontend E2EE implementation:

### Frontend Integration Example
```javascript
import { useEncryption } from '../hooks/useEncryption';
import io from 'socket.io-client';

function GroupChatComponent() {
  const { encryptGroupMessage, decryptMessage } = useEncryption();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to Socket.IO with JWT
    const newSocket = io('http://localhost:3000', {
      auth: {
        token: getJWTToken() // Your JWT token
      }
    });

    // Join random group
    newSocket.emit('join_random_group', {
      publicKey: getCurrentUserPublicKey()
    });

    // Listen for group joined
    newSocket.on('group_joined', (data) => {
      setCurrentGroup(data.group);
    });

    // Listen for new messages
    newSocket.on('new_group_message', async (data) => {
      try {
        const decryptedMessage = await decryptMessage(data.encryptedContent);
        addMessageToChat(decryptedMessage, data.sender);
      } catch (error) {
        console.error('Failed to decrypt message:', error);
      }
    });

    setSocket(newSocket);
  }, []);

  const sendMessage = async (messageText) => {
    if (!socket || !currentGroup) return;

    try {
      const encryptedContent = await encryptGroupMessage(
        messageText,
        currentGroup.members
      );

      socket.emit('send_group_message', {
        groupId: currentGroup.id,
        encryptedMessage: encryptedContent
      });
    } catch (error) {
      console.error('Failed to encrypt message:', error);
    }
  };

  return (
    <div>
      <button onClick={() => socket?.emit('join_random_group', {
        publicKey: getCurrentUserPublicKey()
      })}>
        Join Random Group
      </button>
      {/* Chat UI here */}
    </div>
  );
}
```

## 📡 HTTP API Endpoints

All Socket.IO functionality is also available via HTTP for fallback:

- `POST /api/groups/join-random` - Join random group
- `GET /api/groups/stats` - Group statistics
- `POST /api/groups/:groupId/messages` - Send message
- `GET /api/groups/:groupId/messages` - Get message history
- `POST /api/groups/:groupId/leave` - Leave group

## 🏗️ Database Schema

### Groups Table
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 10,
  current_members INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Group Members Table
```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  user_id INTEGER REFERENCES users(id),
  role ENUM('admin', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  public_key TEXT, -- For E2EE key exchange
  last_seen_at TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  sender_id INTEGER REFERENCES users(id),
  encrypted_content TEXT NOT NULL, -- Serialized encrypted message
  message_type ENUM('text', 'system', 'key_exchange') DEFAULT 'text',
  timestamp TIMESTAMP DEFAULT NOW(),
  is_delivered BOOLEAN DEFAULT false
);
```

## 🧪 Testing

### Test with curl:
```bash
# Health check
curl http://localhost:3000/

# Get group stats
curl http://localhost:3000/api/groups/stats
```

### Test with Socket.IO client:
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.emit('join_random_group', { publicKey: 'test_key' });
socket.on('group_joined', (data) => console.log('Joined:', data));
```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - JWT signing secret
- `CLIENT_URL` - Frontend URL for CORS
- `POSTGRES_*` - Database configuration
- `REDIS_*` - Redis configuration

### Performance Tuning
- Group member limit: 2-50 (configurable per group)
- Redis TTL: 24 hours for sessions, 1 hour for group cache
- Socket.IO ping timeout: 60 seconds
- PostgreSQL connection pool: 5 max connections

## 🚨 Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check database credentials in config.json
3. Verify database exists and user has permissions

### Redis Connection Issues
- Redis is optional - app will run without it
- Check Redis is running on localhost:6379
- Verify Redis configuration in RedisService

### Socket.IO Connection Issues
1. Check CORS settings in index.ts
2. Verify JWT token is valid
3. Check client URL configuration

## 🎯 Integration with Frontend

The Socket.IO implementation is designed to work with your existing React Native E2EE implementation:

1. **Use existing `useEncryption` hook** for all encryption/decryption
2. **Existing API layer** (`encryptedApi.ts`) can be extended
3. **Group management** integrates with existing user authentication
4. **Real-time features** enhance existing chat functionality

The backend never sees plaintext messages - it only routes encrypted content between group members, maintaining full end-to-end encryption. 