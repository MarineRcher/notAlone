#!/usr/bin/env node

/**
 * Socket.IO Group Chat Test Client
 * 
 * This script tests the Socket.IO group chat functionality
 * Run with: node test-socketio-client.js
 */

const { io } = require('socket.io-client');

// Mock user data for testing
const testUsers = [
  { id: 1, login: 'alice', token: 'mock_jwt_token_alice' },
  { id: 2, login: 'bob', token: 'mock_jwt_token_bob' },
  { id: 3, login: 'charlie', token: 'mock_jwt_token_charlie' }
];

function createTestClient(user, serverUrl = 'http://localhost:3000') {
  console.log(`\n🔌 Connecting ${user.login} to ${serverUrl}...`);
  
  const socket = io(serverUrl, {
    auth: {
      token: user.token
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log(`✅ ${user.login} connected with socket ID: ${socket.id}`);
    
    // Join random group after connection
    setTimeout(() => {
      console.log(`📍 ${user.login} attempting to join random group...`);
      socket.emit('join_random_group', {
        publicKey: `mock_public_key_${user.login}`
      });
    }, 1000);
  });

  socket.on('connect_error', (error) => {
    console.error(`❌ ${user.login} connection error:`, error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log(`📱 ${user.login} disconnected:`, reason);
  });

  // Group events
  socket.on('group_joined', (data) => {
    console.log(`🎉 ${user.login} joined group:`, {
      groupId: data.group?.id,
      groupName: data.group?.name,
      members: data.group?.members?.length
    });
    
    // Send a test message after joining
    setTimeout(() => {
      const message = `Hello from ${user.login}! 👋`;
      console.log(`💬 ${user.login} sending message: "${message}"`);
      
      socket.emit('send_group_message', {
        groupId: data.group.id,
        encryptedMessage: `encrypted_${message}`, // Mock encrypted content
        messageType: 'text'
      });
    }, 2000);
  });

  socket.on('new_group_message', (data) => {
    console.log(`📨 ${user.login} received message:`, {
      from: data.sender?.login,
      content: data.encryptedContent,
      timestamp: data.timestamp
    });
  });

  socket.on('user_joined_group', (data) => {
    console.log(`👋 ${user.login} sees new member joined:`, data.user?.login);
  });

  socket.on('user_left_group', (data) => {
    console.log(`👋 ${user.login} sees member left:`, data.user?.login);
  });

  socket.on('typing_indicator', (data) => {
    console.log(`⌨️  ${user.login} sees typing:`, `${data.login} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`❌ ${user.login} socket error:`, error);
  });

  return socket;
}

function runTests() {
  console.log('🧪 Starting Socket.IO Group Chat Tests...\n');
  
  // Test with multiple users
  const sockets = testUsers.map(user => createTestClient(user));
  
  // Simulate typing indicators
  setTimeout(() => {
    if (sockets[0].connected) {
      console.log('\n⌨️  Testing typing indicators...');
      sockets[0].emit('typing_start', { groupId: 'test-group' });
      
      setTimeout(() => {
        sockets[0].emit('typing_stop', { groupId: 'test-group' });
      }, 3000);
    }
  }, 10000);

  // Clean shutdown after tests
  setTimeout(() => {
    console.log('\n🧹 Cleaning up test connections...');
    sockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    
    setTimeout(() => {
      console.log('✅ Tests completed');
      process.exit(0);
    }, 1000);
  }, 20000);
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n👋 Exiting Socket.IO tests...');
  process.exit(0);
});

// Check if server is provided as argument
const serverUrl = process.argv[2] || 'http://localhost:3000';
console.log(`🎯 Testing Socket.IO server at: ${serverUrl}`);

// Start tests
runTests(); 