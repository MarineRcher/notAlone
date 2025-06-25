// Test file for key exchange algorithms

import { 
  DiffieHellmanKeyExchange,
  TripleDiffieHellman,
  KeyDerivation,
  DH,
  TripleDH,
  KDF
} from '../key-exchange';

describe('Key Exchange Algorithms', () => {
  describe('DiffieHellmanKeyExchange', () => {
    test('should generate valid key pairs', () => {
      const keyPair = DiffieHellmanKeyExchange.generateKeyPair();
      
      expect(keyPair.publicKey).toHaveLength(32);
      expect(DiffieHellmanKeyExchange.isValidPublicKey(keyPair.publicKey)).toBe(true);
    });

    test('should compute identical shared secrets', () => {
      const alice = DiffieHellmanKeyExchange.generateKeyPair();
      const bob = DiffieHellmanKeyExchange.generateKeyPair();

      const aliceSecret = alice.computeSharedSecret(bob.publicKey);
      const bobSecret = bob.computeSharedSecret(alice.publicKey);

      expect(aliceSecret).toHaveLength(32);
      expect(bobSecret).toHaveLength(32);
      expect(aliceSecret).toEqual(bobSecret);
    });

    test('should derive encryption keys from shared secret', () => {
      const alice = DiffieHellmanKeyExchange.generateKeyPair();
      const bob = DiffieHellmanKeyExchange.generateKeyPair();
      const sharedSecret = alice.computeSharedSecret(bob.publicKey);

      const encryptionKey = alice.deriveKeys(sharedSecret);
      expect(encryptionKey).toHaveLength(32);
    });

    test('should create from existing private key', () => {
      const privateKey = new Uint8Array(32);
      privateKey.fill(1); // Simple test key
      
      const keyPair = DiffieHellmanKeyExchange.fromPrivateKey(privateKey);
      expect(keyPair.publicKey).toHaveLength(32);
      expect(keyPair.exportPrivateKey()).toEqual(privateKey);
    });
  });

  describe('TripleDiffieHellman', () => {
    test('should compute identical shared secrets for 3DH', () => {
      // Alice keys
      const aliceIdentity = DiffieHellmanKeyExchange.generateKeyPair();
      const aliceEphemeral = DiffieHellmanKeyExchange.generateKeyPair();

      // Bob keys
      const bobIdentity = DiffieHellmanKeyExchange.generateKeyPair();
      const bobEphemeral = DiffieHellmanKeyExchange.generateKeyPair();

      // Perform 3DH
      const aliceSecret = TripleDiffieHellman.performAsInitiator(
        aliceIdentity,
        aliceEphemeral,
        bobIdentity.publicKey,
        bobEphemeral.publicKey
      );

      const bobSecret = TripleDiffieHellman.performAsResponder(
        bobIdentity,
        bobEphemeral,
        aliceIdentity.publicKey,
        aliceEphemeral.publicKey
      );

      expect(aliceSecret).toHaveLength(32);
      expect(bobSecret).toHaveLength(32);
      expect(aliceSecret).toEqual(bobSecret);
    });
  });

  describe('KeyDerivation', () => {
    test('should derive multiple keys', () => {
      const masterSecret = new Uint8Array(32);
      masterSecret.fill(42); // Test value
      
      const salt = new Uint8Array(32);
      const info = new TextEncoder().encode('Test Keys');

      const keys = KeyDerivation.deriveMultipleKeys(
        masterSecret,
        salt,
        info,
        3,
        32
      );

      expect(keys).toHaveLength(3);
      keys.forEach(key => {
        expect(key).toHaveLength(32);
      });

      // Keys should be different
      expect(keys[0]).not.toEqual(keys[1]);
      expect(keys[1]).not.toEqual(keys[2]);
    });

    test('should derive root and chain keys', () => {
      const rootKey = new Uint8Array(32);
      const dhOutput = new Uint8Array(32);
      dhOutput.fill(123); // Test value

      const { rootKey: newRootKey, chainKey } = KeyDerivation.deriveRootAndChainKey(
        rootKey,
        dhOutput
      );

      expect(newRootKey).toHaveLength(32);
      expect(chainKey).toHaveLength(32);
      expect(newRootKey).not.toEqual(chainKey);
      expect(newRootKey).not.toEqual(rootKey);
    });

    test('should derive message keys', () => {
      const chainKey = new Uint8Array(32);
      chainKey.fill(99); // Test value

      const { messageKey, nextChainKey } = KeyDerivation.deriveMessageKey(chainKey);

      expect(messageKey).toHaveLength(32);
      expect(nextChainKey).toHaveLength(32);
      expect(messageKey).not.toEqual(nextChainKey);
      expect(nextChainKey).not.toEqual(chainKey);
    });
  });

  describe('Alias exports', () => {
    test('should export aliases correctly', () => {
      expect(DH).toBe(DiffieHellmanKeyExchange);
      expect(TripleDH).toBe(TripleDiffieHellman);
      expect(KDF).toBe(KeyDerivation);
    });
  });

  describe('Security properties', () => {
    test('should generate different keys each time', () => {
      const key1 = DiffieHellmanKeyExchange.generateKeyPair();
      const key2 = DiffieHellmanKeyExchange.generateKeyPair();

      expect(key1.publicKey).not.toEqual(key2.publicKey);
    });

    test('should validate public key lengths', () => {
      expect(DiffieHellmanKeyExchange.isValidPublicKey(new Uint8Array(32))).toBe(true);
      expect(DiffieHellmanKeyExchange.isValidPublicKey(new Uint8Array(31))).toBe(false);
      expect(DiffieHellmanKeyExchange.isValidPublicKey(new Uint8Array(33))).toBe(false);
    });

    test('should throw on invalid private key length', () => {
      expect(() => {
        DiffieHellmanKeyExchange.fromPrivateKey(new Uint8Array(31));
      }).toThrow('Invalid private key length');

      expect(() => {
        DiffieHellmanKeyExchange.fromPrivateKey(new Uint8Array(33));
      }).toThrow('Invalid private key length');
    });

    test('should throw on invalid public key length in computeSharedSecret', () => {
      const alice = DiffieHellmanKeyExchange.generateKeyPair();
      
      expect(() => {
        alice.computeSharedSecret(new Uint8Array(31));
      }).toThrow('Invalid public key length');
    });
  });
}); 