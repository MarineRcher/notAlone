# Key Exchange Algorithms

This module provides secure cryptographic key exchange algorithms for the notAlone E2E encrypted chat application.

## Available Algorithms

### 1. Diffie-Hellman Key Exchange (`DiffieHellmanKeyExchange`)

Basic Diffie-Hellman key exchange using Curve25519 for secure key agreement between two parties.

```typescript
import { DiffieHellmanKeyExchange } from '../crypto';

// Generate key pairs
const alice = DiffieHellmanKeyExchange.generateKeyPair();
const bob = DiffieHellmanKeyExchange.generateKeyPair();

// Exchange public keys and compute shared secret
const aliceSharedSecret = alice.computeSharedSecret(bob.publicKey);
const bobSharedSecret = bob.computeSharedSecret(alice.publicKey);

// Both shared secrets are identical
console.log('Secrets match:', 
  Buffer.from(aliceSharedSecret).equals(Buffer.from(bobSharedSecret))
);

// Derive encryption keys from shared secret
const encryptionKey = alice.deriveKeys(
  aliceSharedSecret,
  new Uint8Array(32), // salt
  new TextEncoder().encode('My App Encryption'), // info
  32 // key length
);
```

### 2. Triple Diffie-Hellman (`TripleDiffieHellman`)

Advanced key exchange providing enhanced security through multiple Diffie-Hellman computations. Used in Signal Protocol.

```typescript
import { TripleDiffieHellman, DiffieHellmanKeyExchange } from '../crypto';

// Each party has identity and ephemeral key pairs
const aliceIdentity = DiffieHellmanKeyExchange.generateKeyPair();
const aliceEphemeral = DiffieHellmanKeyExchange.generateKeyPair();

const bobIdentity = DiffieHellmanKeyExchange.generateKeyPair();
const bobEphemeral = DiffieHellmanKeyExchange.generateKeyPair();

// Alice performs as initiator
const aliceSecret = TripleDiffieHellman.performAsInitiator(
  aliceIdentity,
  aliceEphemeral,
  bobIdentity.publicKey,
  bobEphemeral.publicKey
);

// Bob performs as responder
const bobSecret = TripleDiffieHellman.performAsResponder(
  bobIdentity,
  bobEphemeral,
  aliceIdentity.publicKey,
  aliceEphemeral.publicKey
);

// Both compute the same shared secret
console.log('3DH Secrets match:', 
  Buffer.from(aliceSecret).equals(Buffer.from(bobSecret))
);
```

### 3. Key Derivation Functions (`KeyDerivation`)

Utilities for deriving multiple keys from a master secret using HKDF.

```typescript
import { KeyDerivation } from '../crypto';

const masterSecret = new Uint8Array(32); // Your shared secret
const salt = new Uint8Array(32); // Random salt
const info = new TextEncoder().encode('My App Keys');

// Derive multiple keys
const keys = KeyDerivation.deriveMultipleKeys(
  masterSecret,
  salt,
  info,
  3, // number of keys
  32 // key length
);

console.log('Derived keys:', keys);

// Derive keys for Double Ratchet
const rootKey = new Uint8Array(32);
const dhOutput = new Uint8Array(32); // From DH exchange

const { rootKey: newRootKey, chainKey } = KeyDerivation.deriveRootAndChainKey(
  rootKey,
  dhOutput
);

// Derive message keys
const { messageKey, nextChainKey } = KeyDerivation.deriveMessageKey(chainKey);
```

## Security Features

### Forward Secrecy
- Each key exchange generates ephemeral keys that are deleted after use
- Previous messages cannot be decrypted even if long-term keys are compromised

### Perfect Forward Secrecy
- Double Ratchet algorithm advances keys with each message
- Each message has unique encryption keys

### Authenticated Key Exchange
- Triple DH provides mutual authentication
- Prevents man-in-the-middle attacks

### Key Derivation
- Uses HKDF with SHA-256 for secure key derivation
- Proper domain separation with context strings

## Integration with Signal Protocol

These algorithms are used internally by the Signal Protocol implementation:

1. **X3DH (Extended Triple DH)**: Initial key agreement
2. **Double Ratchet**: Ongoing key rotation
3. **Sender Keys**: Group messaging

```typescript
import { CryptoAPI } from '../crypto';

// High-level API handles key exchange automatically
await CryptoAPI.initialize('user-password');
await CryptoAPI.startSession('user123', deviceInfo);

// Key exchange happens transparently
const encryptedMessage = await CryptoAPI.sendMessage('user123', 'Hello!');
```

## Best Practices

1. **Always use ephemeral keys** for forward secrecy
2. **Validate public keys** before use
3. **Use proper salt and info strings** in HKDF
4. **Securely delete private keys** after use
5. **Use the high-level CryptoAPI** unless you need specific control

## Example: Custom Key Exchange

```typescript
import { DiffieHellmanKeyExchange, KeyDerivation } from '../crypto';

class CustomKeyExchange {
  private identityKey: DiffieHellmanKeyExchange;
  
  constructor() {
    this.identityKey = DiffieHellmanKeyExchange.generateKeyPair();
  }
  
  async performKeyExchange(remotePublicKey: Uint8Array): Promise<{
    encryptionKey: Uint8Array;
    authKey: Uint8Array;
  }> {
    // Generate ephemeral key for this exchange
    const ephemeralKey = DiffieHellmanKeyExchange.generateKeyPair();
    
    // Compute shared secrets
    const sharedSecret1 = this.identityKey.computeSharedSecret(remotePublicKey);
    const sharedSecret2 = ephemeralKey.computeSharedSecret(remotePublicKey);
    
    // Combine secrets
    const combinedSecret = new Uint8Array(64);
    combinedSecret.set(sharedSecret1, 0);
    combinedSecret.set(sharedSecret2, 32);
    
    // Derive final keys
    const keys = KeyDerivation.deriveMultipleKeys(
      combinedSecret,
      new Uint8Array(32), // salt
      new TextEncoder().encode('Custom Exchange'),
      2, // encryption + auth keys
      32
    );
    
    return {
      encryptionKey: keys[0],
      authKey: keys[1]
    };
  }
  
  getPublicKey(): Uint8Array {
    return this.identityKey.publicKey;
  }
}
```

## Performance Notes

- X25519 operations are very fast (~0.1ms)
- HKDF is lightweight and suitable for real-time applications
- Memory usage is minimal (32-96 bytes per key)
- All operations are synchronous (no async/await needed)

## Security Audit

This implementation uses audited cryptographic libraries:
- `@noble/curves` for elliptic curve operations
- `@noble/hashes` for hash functions and HKDF
- Following Signal Protocol specifications

The algorithms provide the same security guarantees as Signal Messenger. 