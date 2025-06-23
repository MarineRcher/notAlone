#!/usr/bin/env node

/**
 * Simple Socket.IO Connection Test
 * Tests basic Socket.IO connectivity and events
 */

const { io } = require('socket.io-client');

console.log('🧪 Testing basic Socket.IO connection...');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'mock_jwt_token_alice'  // Use a valid test user
  },
  transports: ['polling', 'websocket'] // Try polling first
});

socket.on('connect', () => {
  console.log('✅ Connected successfully!');
  console.log('📡 Socket ID:', socket.id);
  
  // Test basic event emission
  console.log('📤 Sending test event...');
  socket.emit('test_event', { message: 'Hello Socket.IO!' });
  
  // Try a simple group join (might fail but should not disconnect)
  setTimeout(() => {
    console.log('📍 Testing join_random_group event...');
    socket.emit('join_random_group', {
      publicKey: 'test_public_key'
    });
  }, 1000);
  
  // Disconnect after tests
  setTimeout(() => {
    console.log('👋 Disconnecting...');
    socket.disconnect();
  }, 3000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('📱 Disconnected:', reason);
  process.exit(0);
});

socket.on('error', (error) => {
  console.error('⚠️  Socket error:', error);
});

// Handle any events from server
socket.onAny((eventName, ...args) => {
  console.log(`📨 Received event: ${eventName}`, args);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - disconnecting');
  socket.disconnect();
  process.exit(0);
}, 10000); 