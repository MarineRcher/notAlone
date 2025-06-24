# E2EE Group Chat Backend

This backend has been rebuilt from scratch to support end-to-end encrypted group chat functionality that matches the frontend crypto implementation.

## Architecture

### Core Components

1. **E2EEGroupController** - Main controller handling socket connections and authentication
2. **E2EESocketService** - Manages socket events and group lifecycle
3. **E2EEGroupService** - Core business logic for group sessions and waiting rooms
4. **Types** - TypeScript interfaces matching frontend crypto types

## Key Features

### Group Formation Flow

1. **User Connection**: Device connects with Socket.IO using JWT or mock token
2. **Join Request**: User requests to join random group with their public key
3. **Waiting Room**: User is placed in waiting room until enough users (min 3)
4. **Group Creation**: When sufficient users available, new group is created
5. **Key Exchange**: All members receive group info and begin key exchange
6. **Active Group**: Group is sealed when full (max 8 members)

### E2EE Key Management

- **User Keys**: Each user generates their own key pair
- **Group Keys**: Generated from all member public keys
- **Key Rotation**: New group key when members join/leave
- **Forward Secrecy**: Keys regenerated on membership changes

### Group Lifecycle

```
Waiting Room -> Active Group -> Sealed Group -> Deleted Group
     ↑              ↑               ↑              ↑
User joins    Min members     Max members    Empty group
             reached (3)     reached (8)
```

## API Events

### Client -> Server

- `join_random_group` - Join group with public key
- `send_group_message` - Send encrypted message
- `leave_group` - Leave current group
- `crypto_key_exchange` - Exchange cryptographic keys

### Server -> Client

- `joined_waitroom` - Confirmation of waitroom entry
- `joined_random_group` - Group assignment with member list
- `group_message` - Encrypted message from another user
- `user_joined_group` - New member joined group
- `user_left_group` - Member left group
- `crypto_key_exchange` - Key exchange data
- `request_key_exchange` - Server requests new key exchange

## Configuration

- **MIN_MEMBERS**: 3 users minimum to create group
- **MAX_MEMBERS**: 8 users maximum per group
- **WAITROOM_TIMEOUT**: 5 minutes before removing inactive waiting users
- **GROUP_INACTIVITY**: 30 minutes before cleaning up inactive groups

## Security Features

- JWT authentication with mock token support for testing
- Public key validation
- Group membership verification
- Forward secrecy through key rotation
- Automatic cleanup of inactive sessions

## Testing

### Mock Authentication
```javascript
// Use predefined test users
const token = "mock_jwt_token_alice";
const socket = io("http://localhost:3000", {
  auth: { token }
});
```

### Available Test Users
- alice (ID: 1001)
- bob (ID: 1002)  
- charlie (ID: 1003)
- diana (ID: 1004)
- eve (ID: 1005)

## Running the Server

```bash
# Start E2EE server
npm run dev

# Or use the E2EE entry point directly
node index_e2ee.ts
```

## Database Independence

- Groups stored in memory for real-time performance
- Optional database persistence for user authentication
- Redis optional for scaling across multiple servers
- Fully functional without external dependencies

## Compatibility

- Follows ESLint configuration with Allman brace style
- Maximum 25 lines per function
- 80 character line limit
- TypeScript strict mode
- Matches frontend crypto interface exactly 