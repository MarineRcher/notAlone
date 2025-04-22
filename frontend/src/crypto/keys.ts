/**
 * End-to-End Encryption Key Management
 * 
 * This file contains functions for generating, importing, exporting,
 * and managing cryptographic keys for the E2EE implementation.
 * It utilizes expo-crypto for cryptographic operations.
 */

import * as Crypto from 'expo-crypto';
import { ENCRYPTION_CONFIG } from './config';
import * as secureStorage from './storage';
import { KeyPair, SymmetricKey, KeyBundle, SerializedKeyPair } from './types';

// For operations not available in expo-crypto, we still use the Web Crypto API
const cryptoSubtle = global.crypto.subtle;

/**
 * Generates a secure random array of bytes
 * @param length Number of bytes to generate
 * @returns A Uint8Array containing random bytes
 */
export const getRandomBytes = (length: number): Uint8Array => {
  // Fallback to Math.random as a synchronous implementation
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
};

/**
 * Generates a new RSA key pair for asymmetric encryption
 * @returns Promise resolving to a KeyPair object
 */
export const generateAsymmetricKeyPair = async (): Promise<KeyPair> => {
  try {
    const { modulusLength, publicExponent } = ENCRYPTION_CONFIG.KEY_GENERATION.RSA;
    
    // Generate the key pair using Web Crypto API
    const keyPair = await cryptoSubtle.generateKey(
      {
        name: ENCRYPTION_CONFIG.ASYMMETRIC.algorithm,
        modulusLength,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537 in big-endian
        hash: { name: ENCRYPTION_CONFIG.ASYMMETRIC.hashAlgorithm },
      },
      true, // extractable
      ['encrypt', 'decrypt'] // key usages
    );
    
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };
  } catch (error) {
    console.error('Error generating asymmetric key pair:', error);
    throw new Error('Failed to generate asymmetric key pair');
  }
};

/**
 * Generates a new ECDH key pair for key exchange
 * @returns Promise resolving to a KeyPair object
 */
export const generateECDHKeyPair = async (): Promise<KeyPair> => {
  try {
    const { namedCurve } = ENCRYPTION_CONFIG.KEY_GENERATION.ECDH;
    
    // Generate the ECDH key pair
    const keyPair = await cryptoSubtle.generateKey(
      {
        name: 'ECDH',
        namedCurve,
      },
      true, // extractable
      ['deriveKey', 'deriveBits'] // key usages
    );
    
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };
  } catch (error) {
    console.error('Error generating ECDH key pair:', error);
    throw new Error('Failed to generate ECDH key pair');
  }
};

/**
 * Generates a symmetric key for message encryption
 * @returns Promise resolving to a CryptoKey
 */
export const generateSymmetricKey = async (): Promise<CryptoKey> => {
  try {
    const { algorithm, keySize } = ENCRYPTION_CONFIG.SYMMETRIC;
    
    // Generate a random symmetric key
    const key = await cryptoSubtle.generateKey(
      {
        name: algorithm,
        length: keySize,
      },
      true, // extractable
      ['encrypt', 'decrypt'] // key usages
    );
    
    return key;
  } catch (error) {
    console.error('Error generating symmetric key:', error);
    throw new Error('Failed to generate symmetric key');
  }
};

/**
 * Generates an initialization vector (IV) for AES-GCM encryption
 * @returns A Uint8Array containing the random IV
 */
export const generateIV = (): Uint8Array => {
  const { ivLength } = ENCRYPTION_CONFIG.SYMMETRIC;
  return getRandomBytes(ivLength);
};

/**
 * Generates a salt for key derivation
 * @returns A Uint8Array containing the random salt
 */
export const generateSalt = (): Uint8Array => {
  const { saltLength } = ENCRYPTION_CONFIG.KDF;
  return getRandomBytes(saltLength);
};

/**
 * Derives a key from a password using PBKDF2
 * @param password The password to derive from
 * @param salt The salt to use (or generates a new one if not provided)
 * @returns Promise with the derived key and salt
 */
export const deriveKeyFromPassword = async (
  password: string,
  salt?: Uint8Array
): Promise<{ key: CryptoKey; salt: Uint8Array }> => {
  try {
    const { iterations, hashAlgorithm } = ENCRYPTION_CONFIG.KDF;
    const { algorithm: symAlgorithm, keySize } = ENCRYPTION_CONFIG.SYMMETRIC;
    
    // Generate or use provided salt
    const usedSalt = salt || generateSalt();
    
    // Convert password to raw key material
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    // Use Web Crypto API for PBKDF2
    const keyMaterial = await cryptoSubtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive the key using PBKDF2
    const derivedKey = await cryptoSubtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: usedSalt,
        iterations,
        hash: hashAlgorithm,
      },
      keyMaterial,
      {
        name: symAlgorithm,
        length: keySize,
      },
      true, // extractable
      ['encrypt', 'decrypt'] // key usages
    );
    
    return { key: derivedKey, salt: usedSalt };
  } catch (error) {
    console.error('Error deriving key from password:', error);
    throw new Error('Failed to derive key from password');
  }
};

/**
 * Exports a CryptoKey to raw bytes
 * @param key The CryptoKey to export
 * @returns Promise resolving to the exported key as a Uint8Array
 */
export const exportKey = async (key: CryptoKey): Promise<Uint8Array> => {
  try {
    const format = key.type === 'private' ? 'pkcs8' : 'spki';
    const exported = await cryptoSubtle.exportKey(format, key);
    return new Uint8Array(exported);
  } catch (error) {
    console.error('Error exporting key:', error);
    throw new Error('Failed to export key');
  }
};

/**
 * Imports a public key from raw bytes
 * @param keyData The key data as a Uint8Array
 * @param algorithm The algorithm to use for the key
 * @returns Promise resolving to the imported CryptoKey
 */
export const importPublicKey = async (
  keyData: Uint8Array,
  algorithm: string = ENCRYPTION_CONFIG.ASYMMETRIC.algorithm
): Promise<CryptoKey> => {
  try {
    const key = await cryptoSubtle.importKey(
      'spki',
      keyData,
      {
        name: algorithm,
        hash: { name: ENCRYPTION_CONFIG.ASYMMETRIC.hashAlgorithm },
      },
      true, // extractable
      ['encrypt'] // key usages for public key
    );
    
    return key;
  } catch (error) {
    console.error('Error importing public key:', error);
    throw new Error('Failed to import public key');
  }
};

/**
 * Imports a private key from raw bytes
 * @param keyData The key data as a Uint8Array
 * @param algorithm The algorithm to use for the key
 * @returns Promise resolving to the imported CryptoKey
 */
export const importPrivateKey = async (
  keyData: Uint8Array,
  algorithm: string = ENCRYPTION_CONFIG.ASYMMETRIC.algorithm
): Promise<CryptoKey> => {
  try {
    const key = await cryptoSubtle.importKey(
      'pkcs8',
      keyData,
      {
        name: algorithm,
        hash: { name: ENCRYPTION_CONFIG.ASYMMETRIC.hashAlgorithm },
      },
      true, // extractable
      ['decrypt'] // key usages for private key
    );
    
    return key;
  } catch (error) {
    console.error('Error importing private key:', error);
    throw new Error('Failed to import private key');
  }
};

/**
 * Serializes a KeyPair to a format that can be stored
 * @param keyPair The KeyPair to serialize
 * @returns Promise resolving to a SerializedKeyPair
 */
export const serializeKeyPair = async (keyPair: KeyPair): Promise<SerializedKeyPair> => {
  const publicKeyData = await exportKey(keyPair.publicKey);
  const privateKeyData = await exportKey(keyPair.privateKey);
  
  return {
    publicKey: Buffer.from(publicKeyData).toString('base64'),
    privateKey: Buffer.from(privateKeyData).toString('base64'),
  };
};

/**
 * Deserializes a SerializedKeyPair back to a KeyPair
 * @param serialized The SerializedKeyPair to deserialize
 * @returns Promise resolving to a KeyPair
 */
export const deserializeKeyPair = async (serialized: SerializedKeyPair): Promise<KeyPair> => {
  const publicKeyData = new Uint8Array(Buffer.from(serialized.publicKey, 'base64'));
  const privateKeyData = new Uint8Array(Buffer.from(serialized.privateKey, 'base64'));
  
  const publicKey = await importPublicKey(publicKeyData);
  const privateKey = await importPrivateKey(privateKeyData);
  
  return { publicKey, privateKey };
};

/**
 * Generates or retrieves the device's identity key pair
 * Creates a new one if none exists
 * @returns Promise resolving to the identity KeyPair
 */
export const getOrCreateIdentityKeyPair = async (): Promise<KeyPair> => {
  try {
    // Try to retrieve existing identity key pair
    const storedKeyPair = await secureStorage.getItem(ENCRYPTION_CONFIG.STORAGE.keys.identityKey);
    
    if (storedKeyPair) {
      // Deserialize and return the existing key pair
      const serialized = JSON.parse(storedKeyPair) as SerializedKeyPair;
      return await deserializeKeyPair(serialized);
    }
    
    // Generate a new identity key pair if none exists
    const newKeyPair = await generateAsymmetricKeyPair();
    const serialized = await serializeKeyPair(newKeyPair);
    
    // Store the new key pair
    await secureStorage.setItem(
      ENCRYPTION_CONFIG.STORAGE.keys.identityKey,
      JSON.stringify(serialized)
    );
    
    return newKeyPair;
  } catch (error) {
    console.error('Error getting or creating identity key pair:', error);
    throw new Error('Failed to get or create identity key pair');
  }
};

/**
 * Generates a complete set of keys for a new E2EE session
 * @returns Promise resolving to a KeyBundle
 */
export const generateKeyBundle = async (): Promise<KeyBundle> => {
  // Generate all required keys
  const asymmetricKeyPair = await generateAsymmetricKeyPair();
  const ecdhKeyPair = await generateECDHKeyPair();
  const symmetricKey = await generateSymmetricKey();
  
  return {
    asymmetricKeyPair,
    ecdhKeyPair,
    symmetricKey,
  };
};

/**
 * Computes a digital signature for data
 * @param data The data to sign
 * @param privateKey The private key to sign with
 * @returns Promise resolving to the signature as a Uint8Array
 */
export const signData = async (data: Uint8Array, privateKey: CryptoKey): Promise<Uint8Array> => {
  try {
    const { algorithm, hashAlgorithm } = ENCRYPTION_CONFIG.SIGNATURE;
    
    const signature = await cryptoSubtle.sign(
      {
        name: algorithm,
        hash: { name: hashAlgorithm },
      },
      privateKey,
      data
    );
    
    return new Uint8Array(signature);
  } catch (error) {
    console.error('Error signing data:', error);
    throw new Error('Failed to sign data');
  }
};

/**
 * Verifies a digital signature
 * @param data The original data
 * @param signature The signature to verify
 * @param publicKey The public key to verify with
 * @returns Promise resolving to true if the signature is valid
 */
export const verifySignature = async (
  data: Uint8Array,
  signature: Uint8Array,
  publicKey: CryptoKey
): Promise<boolean> => {
  try {
    const { algorithm, hashAlgorithm } = ENCRYPTION_CONFIG.SIGNATURE;
    
    const isValid = await cryptoSubtle.verify(
      {
        name: algorithm,
        hash: { name: hashAlgorithm },
      },
      publicKey,
      signature,
      data
    );
    
    return isValid;
  } catch (error) {
    console.error('Error verifying signature:', error);
    throw new Error('Failed to verify signature');
  }
};

/**
 * Performs an ECDH key exchange to derive a shared secret
 * @param privateKey Our private ECDH key
 * @param publicKey Their public ECDH key
 * @returns Promise resolving to the derived symmetric key
 */
export const deriveSharedKey = async (
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> => {
  try {
    const { algorithm, keySize } = ENCRYPTION_CONFIG.SYMMETRIC;
    
    // Derive shared bits using ECDH
    const sharedKey = await cryptoSubtle.deriveKey(
      {
        name: 'ECDH',
        public: publicKey,
      },
      privateKey,
      {
        name: algorithm,
        length: keySize,
      },
      true, // extractable
      ['encrypt', 'decrypt'] // key usages
    );
    
    return sharedKey;
  } catch (error) {
    console.error('Error deriving shared key:', error);
    throw new Error('Failed to derive shared key');
  }
};

/**
 * Hashes data using the specified algorithm
 * @param data The data to hash
 * @param algorithm The hashing algorithm to use
 * @returns Promise resolving to the hash as a Uint8Array
 */
export const hashData = async (
  data: Uint8Array | string
): Promise<Uint8Array> => {
  try {
    // Convert string to Uint8Array if needed
    const dataBuffer = typeof data === 'string' 
      ? new TextEncoder().encode(data) 
      : data;
      
    // Use expo-crypto to hash the data
    const digestStr = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Buffer.from(dataBuffer).toString('base64')
    );
    
    // Convert the hex string back to Uint8Array
    return new Uint8Array(Buffer.from(digestStr, 'hex'));
  } catch (error) {
    console.error('Error hashing data:', error);
    throw new Error('Failed to hash data');
  }
};