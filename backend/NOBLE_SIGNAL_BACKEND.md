# Noble Signal Protocol Backend

## Overview

This backend implementation is specifically designed to work with the **Noble Signal Protocol** - a pure TypeScript implementation of the Signal Protocol for React Native/Expo applications. It replaces the previous implementation that relied on Node.js-specific libraries.

## Architecture

### Key Components

1. **NobleSignalController** - Handles Socket.IO connections and Signal protocol events
2. **Signal Types** - TypeScript interfaces matching the frontend implementation
3. **Noble Group Routes** - HTTP endpoints for group management
4. **Group Service** - Database operations and group logic

### Protocol Compatibility

- **Frontend**: Pure TypeScript Signal Protocol using Noble Cryptography
- **Backend**: Message relay and storage (no cryptographic operations)
- **Wire Format**: JSON-serialized encrypted messages with number arrays

## Socket.IO Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `join_group` | `{ groupId: string }` | Join a group for E2EE chat |
| `leave_group` | `{ groupId: string }` | Leave a group |
| `group_message` | `{ groupId: string, encryptedMessage: EncryptedMessage }` | Send encrypted message |
| `sender_key_distribution` | `{ groupId: string, targetUserId: string, distributionMessage: SenderKeyBundle }` | Share sender key with specific user |
| `request_sender_key` | `{ groupId: string, fromUserId: string }` | Request sender key from user |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `group_members` | `{ members: GroupMemberInfo[] }` | Current group members |
| `member_joined` | `{ userId: string, username: string }` | User joined group |
| `member_left` | `{ userId: string, username: string }` | User left group |
| `group_message` | `{ encryptedMessage: EncryptedMessage, senderId: string, senderName: string }` | Encrypted message from another user |
| `sender_key_distribution` | `{ groupId: string, fromUserId: string, distributionMessage: SenderKeyBundle }` | Sender key from another user |
| `request_sender_key` | `{ groupId: string, fromUserId: string }` | Request for your sender key |

## Data Types

### EncryptedMessage
```typescript
interface EncryptedMessage {
  messageId: string;
  timestamp: number;
  groupId: string;
  senderId: string;
  encryptedPayload: number[]; // Uint8Array serialized as number array
  signature: number[]; // Uint8Array serialized as number array
  keyIndex: number;
}
```

### SenderKeyBundle
```typescript
interface SenderKeyBundle {
  userId: string;
  groupId: string;
  chainKey: number[]; // Uint8Array serialized as number array
  signingPublicKey: number[]; // Uint8Array serialized as number array
  keyIndex: number;
}
```

## HTTP Endpoints

### Noble Groups API (`/api/noble-groups`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Get group statistics |
| POST | `/join-random` | Join a random group (HTTP fallback) |
| POST | `/:groupId/leave` | Leave a group |
| GET | `/:groupId` | Get group information |
| GET | `/:groupId/messages` | Get encrypted messages |
| POST | `/:groupId/messages` | Send encrypted message (HTTP fallback) |
| GET | `/test/protocol` | Protocol information and status |

## Authentication

### Test Users (Development)
```javascript
const mockTokens = {
  alice: 'mock_jwt_token_alice',   // ID: 1001
  bob: 'mock_jwt_token_bob',       // ID: 1002
  charlie: 'mock_jwt_token_charlie', // ID: 1003
  diana: 'mock_jwt_token_diana',   // ID: 1004
  eve: 'mock_jwt_token_eve'        // ID: 1005
};
```

### Real Authentication
```javascript
// JWT token with standard payload
{
  id: userId,        // or userId
  login: username,   // optional
  // ... other JWT claims
}
```

## Testing

### Manual Testing
```bash
# Run the Noble Signal Protocol test suite
cd backend
node tests/manual/test-noble-signal.js

# Test group cleanup functionality
node tests/manual/test-group-cleanup.js
```

### Test Coverage
- ✅ Socket.IO authentication
- ✅ Group joining/leaving
- ✅ Encrypted message relay
- ✅ Sender key distribution
- ✅ Error handling and cleanup
- ✅ Automatic group deletion when empty

## Group Lifecycle Management

### Automatic Cleanup
When a group becomes empty (all members leave or disconnect), the backend automatically:
1. **Removes Group**: Deletes the group from the database
2. **Cleans Messages**: Removes all associated encrypted messages
3. **Clears Memberships**: Removes all group member relationships
4. **Cache Cleanup**: Clears Redis cache entries

### Supported Group ID Formats
- **UUID Groups**: Full database integration with cleanup
- **Named Groups**: Maps to UUID groups for database operations
- **Mixed Support**: Handles both formats transparently

### Database Consistency
- User leaving explicitly triggers cleanup check
- User disconnect automatically triggers cleanup check  
- Group member count is always kept accurate
- Empty groups are immediately deleted

## Security Features

### What the Backend Does
- **Message Relay**: Forwards encrypted messages between group members
- **Sender Key Distribution**: Facilitates secure key exchange
- **Group Management**: Handles membership and connections
- **Message Storage**: Stores encrypted messages for offline users
- **Automatic Cleanup**: Removes empty groups and associated data

### What the Backend Does NOT Do
- **Decryption**: Never sees plaintext messages
- **Key Generation**: No cryptographic key operations
- **Message Inspection**: Cannot read message contents
- **Cryptographic Operations**: All crypto happens on client

## Integration with Frontend

### Compatible Frontend API
```typescript
// Frontend uses these methods that work with this backend
await CryptoAPI.initialize();
await CryptoAPI.createGroup(groupId, userId);
const encrypted = await CryptoAPI.sendGroupMessage(groupId, message);
const decrypted = await CryptoAPI.receiveGroupMessage(groupId, encryptedMessage);
```

### Socket Connection
```typescript
const socket = io(SERVER_URL, {
  auth: { token: userJwtToken },
  transports: ['websocket']
});
```

## Database Schema

The backend reuses existing database models:
- **Group**: Group metadata and status
- **GroupMember**: Member relationships
- **Message**: Encrypted message storage
- **User**: User accounts

Messages are stored with `encryptedContent` field containing JSON-serialized `EncryptedMessage` objects.

## Environment Variables

```bash
# Required
PORT=3000
JWT_SECRET=your-secret-key

# Optional (for full functionality)
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:8081
```

## Deployment

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm install --production
npm run build
npm start
```

### Docker
```bash
docker-compose up -d
```

## Monitoring

### Health Check
```bash
curl http://localhost:3000/
```

### Protocol Status
```bash
curl http://localhost:3000/api/noble-groups/test/protocol
```

### Group Statistics
```bash
curl http://localhost:3000/api/noble-groups/stats
```

## Migration from Previous Implementation

### Changes Made
1. ✅ Replaced `SignalGroupController` with `NobleSignalController`
2. ✅ Updated type definitions for Noble compatibility
3. ✅ Created Noble-specific routes
4. ✅ Updated Socket.IO event handling
5. ✅ Added comprehensive testing

### Breaking Changes
- Socket event payloads now use number arrays instead of base64 strings
- Different type structure for encrypted messages
- New endpoint paths under `/api/noble-groups`

### Backward Compatibility
- Old `/api/groups` endpoints still available
- Database schema unchanged
- Authentication system unchanged

## Support

For questions about the Noble Signal Protocol backend implementation, please refer to:
- Frontend crypto implementation in `frontend/src/crypto/`
- Socket.IO event documentation above
- Test files in `backend/tests/manual/`

---

**🔑 Noble Signal Protocol - Pure TypeScript E2EE for React Native** 