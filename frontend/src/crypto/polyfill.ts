/**
 * Simplified Crypto Setup for React Native
 * 
 * This file creates a minimal crypto setup using only expo-crypto
 * and react-native-get-random-values for basic encryption needs.
 */

import * as Crypto from 'expo-crypto';

console.log('🔍 Setting up simplified crypto for React Native...');

// Add Buffer polyfill for React Native
if (typeof global !== 'undefined' && typeof global.Buffer === 'undefined') {
  console.log('📦 Adding Buffer polyfill...');
  
  // Simple Buffer polyfill for basic functionality
  const BufferPolyfill = {
    from: (data: any, encoding?: string): any => {
      if (typeof data === 'string') {
        if (encoding === 'base64') {
          // Simple base64 to Uint8Array conversion
          const binaryString = atob(data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return {
            buffer: bytes.buffer,
            toString: (enc?: string) => {
              if (enc === 'base64') {
                return btoa(String.fromCharCode(...bytes));
              }
              return String.fromCharCode(...bytes);
            }
          };
        } else {
          // String to Uint8Array
          const encoder = new TextEncoder();
          const bytes = encoder.encode(data);
          return {
            buffer: bytes.buffer,
            toString: (enc?: string) => {
              if (enc === 'base64') {
                return btoa(String.fromCharCode(...bytes));
              }
              return data;
            }
          };
        }
      } else if (data instanceof Uint8Array) {
        return {
          buffer: data.buffer,
          toString: (enc?: string) => {
            if (enc === 'base64') {
              return btoa(String.fromCharCode(...data));
            } else if (enc === 'hex') {
              return Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
            }
            return String.fromCharCode(...data);
          }
        };
      }
      return data;
    },
    
    concat: (arrays: any[]): any => {
      let totalLength = 0;
      for (const arr of arrays) {
        totalLength += arr.length || arr.byteLength || 0;
      }
      
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const arr of arrays) {
        if (arr instanceof Uint8Array) {
          result.set(arr, offset);
          offset += arr.length;
        } else if (arr.buffer) {
          const bytes = new Uint8Array(arr.buffer);
          result.set(bytes, offset);
          offset += bytes.length;
        }
      }
      
      return BufferPolyfill.from(result);
    }
  };
  
  // @ts-ignore - Add Buffer to global
  global.Buffer = BufferPolyfill;
  console.log('✅ Buffer polyfill added');
}

// Ensure global.crypto exists with basic functionality
if (typeof global !== 'undefined') {
  if (!global.crypto) {
    console.log('📦 Creating basic crypto object...');
    // @ts-ignore - Create basic crypto object
    global.crypto = {};
  }
  
  // Add getRandomValues if not present (should be provided by react-native-get-random-values)
  if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = (array: any) => {
      // Fallback implementation
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    };
    console.log('📦 Added fallback getRandomValues');
  }
  
  // Add basic subtle crypto functions using expo-crypto
  if (!global.crypto.subtle) {
    console.log('📦 Creating simplified subtle crypto using expo-crypto...');
    
    // @ts-ignore - Create simplified subtle object
    global.crypto.subtle = {
      // For now, these will throw descriptive errors
      generateKey: () => Promise.reject(new Error('Use expo-crypto for key generation instead of Web Crypto API')),
      encrypt: () => Promise.reject(new Error('Use expo-crypto for encryption instead of Web Crypto API')),
      decrypt: () => Promise.reject(new Error('Use expo-crypto for decryption instead of Web Crypto API')),
      importKey: () => Promise.reject(new Error('Use expo-crypto for key import instead of Web Crypto API')),
      exportKey: () => Promise.reject(new Error('Use expo-crypto for key export instead of Web Crypto API')),
      sign: () => Promise.reject(new Error('Use expo-crypto for signing instead of Web Crypto API')),
      verify: () => Promise.reject(new Error('Use expo-crypto for verification instead of Web Crypto API')),
      deriveKey: () => Promise.reject(new Error('Use expo-crypto for key derivation instead of Web Crypto API')),
      deriveBits: () => Promise.reject(new Error('Use expo-crypto for key derivation instead of Web Crypto API'))
    };
  }
  
  console.log('✅ Basic crypto setup complete:', {
    crypto: !!global.crypto,
    getRandomValues: typeof global.crypto.getRandomValues === 'function',
    subtle: !!global.crypto.subtle,
    expoCrypto: !!Crypto
  });
  
  // Test expo-crypto availability
  try {
    const testBytes = Crypto.getRandomBytes(16);
    console.log('✅ expo-crypto is working:', { randomBytesLength: testBytes.length });
  } catch (error) {
    console.error('❌ expo-crypto test failed:', error);
  }
} else {
  console.error('❌ global object not available');
}

export default global.crypto; 