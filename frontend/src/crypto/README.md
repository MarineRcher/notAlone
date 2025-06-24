# Group Chat Crypto Implementation

This is a complete end-to-end encryption implementation for group chat functionality. The system provides secure messaging between multiple users in a group with key rotation when members join or leave.

## Architecture

### Key Components

1. **Types** (`types.ts`) - TypeScript interfaces and types
2. **Utils** (`utils.ts`) - Core cryptographic utilities using expo-crypto
3. **Storage** (`storage.ts`) - Secure storage using expo-secure-store
4. **Group Crypto Manager** (`groupCryptoManager.ts`) - Main encryption/decryption logic
5. **Key Exchange** (`keyExchange.ts`) - Protocol for exchanging keys
6. **Main API** (`index.ts`) - Simple API interface
7. **Config** (`config.ts`) - Configuration constants

### Algorithm Overview

1. **User Key Generation**: Each user generates a unique public/private key pair
2. **Group Key Generation**: Combines all active member public keys using SHA-512
3. **Message Encryption**: Uses XOR encryption with the group key
4. **Key Rotation**: New group key generated when members join/leave
5. **Secure Storage**: All keys stored using expo-secure-store

## Usage Example

```typescript
import { groupChatCrypto, GroupMember } from "./crypto";

// Initialize user
const userId = "user123";
const userKeyPair = await groupChatCrypto.initializeUser(userId);

// Join a group
const groupId = "group456";
const newMember: GroupMember = {
	userId: userId,
	publicKey: userKeyPair.publicKey,
	isActive: true
};
const existingMembers: GroupMember[] = []; // Other members

const groupKeyInfo = await groupChatCrypto.joinGroup(
	groupId,
	newMember,
	existingMembers
);

// Encrypt a message
const message = "Hello, group!";
const encryptedMessage = await groupChatCrypto.encryptMessage(groupId, message);

// Decrypt a message
const decryptedMessage = await groupChatCrypto.decryptMessage(
	groupId,
	encryptedMessage
);

// Handle member leaving
await groupChatCrypto.leaveGroup(groupId, userId, remainingMembers);
```

## Security Features

- **Forward Secrecy**: New group keys generated when membership changes
- **Perfect Forward Secrecy**: Old messages cannot be decrypted with new keys
- **Secure Storage**: Keys stored using expo-secure-store (hardware-backed when available)
- **Key Versioning**: Messages tagged with key version for proper decryption
- **Member Authentication**: Public key verification for group members

## Integration with Socket.IO

The system is designed to work with socket.io for real-time messaging:

1. User joins group → Generate/exchange keys → Send KEY_EXCHANGE message
2. Send encrypted message → Encrypt with group key → Send via socket
3. Receive encrypted message → Decrypt with group key → Display
4. Member leaves → Generate new group key → Send MEMBER_LEFT message

## Configuration

See `config.ts` for customizable settings:

- Key lengths and algorithms
- Group size limits
- Storage keys
- Error messages

## Error Handling

All functions throw descriptive errors defined in `CRYPTO_ERRORS` constant.
Always wrap crypto operations in try-catch blocks.

## Dependencies

- `expo-crypto` - Core cryptographic operations
- `expo-secure-store` - Secure key storage
- TypeScript - Type safety and interfaces
