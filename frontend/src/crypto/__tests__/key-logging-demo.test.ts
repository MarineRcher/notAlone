// Test to demonstrate key generation logging for each device

import { CryptoAPI } from '../index';
import { DiffieHellmanKeyExchange, TripleDiffieHellman } from '../key-exchange';

describe('Key Generation Logging Demo', () => {
  test('should log key generation for device initialization', async () => {
    console.log('\n🚀 ===== DEVICE INITIALIZATION DEMO =====\n');
    
    // Simulate two devices initializing
    console.log('📱 Device A initializing...');
    await CryptoAPI.initialize('device-a-password');
    
    console.log('\n📱 Device B initializing...');
    await CryptoAPI.initialize('device-b-password');
    
    console.log('\n✅ Both devices initialized with unique identity keys\n');
  });

  test('should log DH key exchange between devices', () => {
    console.log('\n🤝 ===== DEVICE-TO-DEVICE KEY EXCHANGE DEMO =====\n');
    
    console.log('📱 Device A generating key pair...');
    const deviceA = DiffieHellmanKeyExchange.generateKeyPair();
    
    console.log('\n📱 Device B generating key pair...');
    const deviceB = DiffieHellmanKeyExchange.generateKeyPair();
    
    console.log('\n🔄 Performing mutual key exchange...');
    const secretA = deviceA.computeSharedSecret(deviceB.publicKey);
    const secretB = deviceB.computeSharedSecret(deviceA.publicKey);
    
    expect(secretA).toEqual(secretB);
    console.log('\n✅ Shared secrets match - secure channel established\n');
  });

  test('should log Triple DH for enhanced security', () => {
    console.log('\n🔐 ===== TRIPLE DIFFIE-HELLMAN DEMO =====\n');
    
    console.log('📱 Device A preparing keys...');
    const aliceIdentity = DiffieHellmanKeyExchange.generateKeyPair();
    const aliceEphemeral = DiffieHellmanKeyExchange.generateKeyPair();
    
    console.log('\n📱 Device B preparing keys...');
    const bobIdentity = DiffieHellmanKeyExchange.generateKeyPair();
    const bobEphemeral = DiffieHellmanKeyExchange.generateKeyPair();
    
    console.log('\n🔄 Performing Triple DH as initiator...');
    const secretA = TripleDiffieHellman.performAsInitiator(
      aliceIdentity,
      aliceEphemeral, 
      bobIdentity.publicKey,
      bobEphemeral.publicKey
    );
    
    console.log('\n🔄 Performing Triple DH as responder...');
    const secretB = TripleDiffieHellman.performAsResponder(
      bobIdentity,
      bobEphemeral,
      aliceIdentity.publicKey,
      aliceEphemeral.publicKey
    );
    
    expect(secretA).toEqual(secretB);
    console.log('\n✅ Triple DH complete - enhanced security established\n');
  });

  test('should log device info generation for key exchange', async () => {
    console.log('\n📋 ===== DEVICE INFO GENERATION DEMO =====\n');
    
    console.log('📱 Device preparing info bundle for other devices...');
    await CryptoAPI.initialize('demo-device-password');
    
    const deviceInfo = CryptoAPI.getDeviceInfo();
    
    expect(deviceInfo).toBeDefined();
    expect(deviceInfo.deviceId).toBeDefined();
    expect(deviceInfo.identityKey).toBeDefined();
    expect(deviceInfo.preKeys).toBeDefined();
    
    console.log('\n✅ Device info bundle ready for sharing\n');
  });

  test('should log group creation and member key setup', async () => {
    console.log('\n👥 ===== GROUP CREATION DEMO =====\n');
    
    await CryptoAPI.initialize('group-admin-password');
    
    const groupId = 'demo-group-123';
    const userId = 'user-admin';
    
    console.log(`📱 Creating group ${groupId} with admin ${userId}...`);
    await CryptoAPI.createGroup(groupId, userId);
    
    console.log('\n🔑 Getting sender key bundle for sharing...');
    const senderBundle = await CryptoAPI.getSenderKeyBundle(groupId);
    
    expect(senderBundle).toBeDefined();
    expect(senderBundle.userId).toBe(userId);
    expect(senderBundle.signingKey).toBeDefined();
    expect(senderBundle.chainKey).toBeDefined();
    
    console.log('\n✅ Group created with sender keys ready for members\n');
  });

  test('should demonstrate complete device-to-device flow', async () => {
    console.log('\n🌐 ===== COMPLETE DEVICE FLOW DEMO =====\n');
    
    // Device A setup
    console.log('📱 Device A: Complete setup...');
    await CryptoAPI.initialize('device-a-complete');
    const deviceAInfo = CryptoAPI.getDeviceInfo();
    
    // Device B setup  
    console.log('\n📱 Device B: Complete setup...');
    await CryptoAPI.initialize('device-b-complete');
    const deviceBInfo = CryptoAPI.getDeviceInfo();
    
    // Session establishment would trigger more key generation
    console.log('\n🤝 Devices ready for session establishment');
    console.log('   (Session creation would trigger additional key generation)');
    
    expect(deviceAInfo.deviceId).not.toBe(deviceBInfo.deviceId);
    console.log('\n✅ Complete flow demonstrated with unique device identities\n');
  });
}); 