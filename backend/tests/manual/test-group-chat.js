const io = require('socket.io-client');
const axios = require('axios');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const JWT_TOKEN = 'your_jwt_token_here'; // Replace with actual token

// Test HTTP endpoints
async function testHttpEndpoints() {
  console.log('🧪 Testing HTTP Endpoints...\n');
  
  try {
    // Test server health
    const health = await axios.get(`${SERVER_URL}/`);
    console.log('✅ Server Health:', health.data.status);
    
    // Test group statistics
    const stats = await axios.get(`${SERVER_URL}/api/groups/stats`);
    console.log('📊 Group Stats:', stats.data);
    
    // Test join random group (requires auth)
    if (JWT_TOKEN !== 'your_jwt_token_here') {
      const joinResponse = await axios.post(
        `${SERVER_URL}/api/groups/join-random`,
        { publicKey: 'test_public_key_base64' },
        { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
      );
      console.log('🎲 Join Random Group:', joinResponse.data);
    } else {
      console.log('⚠️  Skipping authenticated endpoints (no JWT token)');
    }
    
  } catch (error) {
    console.error('❌ HTTP Test Error:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

// Test Socket.IO connection
function testSocketConnection() {
  console.log('🔌 Testing Socket.IO Connection...\n');
  
  const socket = io(SERVER_URL, {
    auth: {
      token: JWT_TOKEN
    }
  });
  
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
    
    // Test join random group
    socket.emit('join_random_group', {
      publicKey: 'test_public_key_base64'
    }, (response) => {
      console.log('🎲 Join Random Group Response:', response);
      
      if (response.success && response.group) {
        const groupId = response.group.id;
        
        // Test sending a message
        socket.emit('send_group_message', {
          groupId,
          encryptedMessage: JSON.stringify({
            header: {
              version: '1.0',
              senderId: 'test_user',
              recipientId: '',
              messageId: 'test_msg_' + Date.now(),
              timestamp: Date.now(),
              iv: 'test_iv_base64'
            },
            ciphertext: 'encrypted_hello_world_base64',
            signature: 'test_signature_base64',
            groupId
          }),
          messageType: 'text'
        }, (msgResponse) => {
          console.log('💬 Send Message Response:', msgResponse);
        });
        
        // Test getting messages
        socket.emit('get_group_messages', {
          groupId,
          limit: 10
        }, (messagesResponse) => {
          console.log('📜 Group Messages:', messagesResponse);
        });
        
        // Test typing indicators
        socket.emit('typing_start', { groupId });
        setTimeout(() => {
          socket.emit('typing_stop', { groupId });
        }, 2000);
        
        // Test leaving group after 5 seconds
        setTimeout(() => {
          socket.emit('leave_group', { groupId }, (leaveResponse) => {
            console.log('👋 Leave Group Response:', leaveResponse);
            socket.disconnect();
          });
        }, 5000);
      }
    });
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });
  
  socket.on('user_joined', (data) => {
    console.log('👤 User joined:', data);
  });
  
  socket.on('user_left', (data) => {
    console.log('👋 User left:', data);
  });
  
  socket.on('new_message', (data) => {
    console.log('💬 New message:', {
      id: data.id,
      senderId: data.senderId,
      senderLogin: data.senderLogin,
      messageType: data.messageType,
      timestamp: data.timestamp
    });
  });
  
  socket.on('user_typing', (data) => {
    console.log('⌨️  Typing indicator:', data);
  });
  
  socket.on('system_message', (data) => {
    console.log('🔔 System message:', data);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });
}

// Test E2EE integration endpoints
async function testE2EEEndpoints() {
  console.log('🔐 Testing E2EE Integration Endpoints...\n');
  
  try {
    // Test public key endpoint
    const publicKeyResponse = await axios.get(`${SERVER_URL}/api/users/123/public-key`);
    console.log('🔑 Public Key Response:', publicKeyResponse.data);
    
    // Test session initialization (requires auth)
    if (JWT_TOKEN !== 'your_jwt_token_here') {
      const sessionResponse = await axios.post(
        `${SERVER_URL}/api/users/123/sessions`,
        {
          publicKey: 'test_public_key',
          timestamp: Date.now(),
          signature: 'test_signature'
        },
        { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
      );
      console.log('🤝 Session Init Response:', sessionResponse.data);
    }
    
  } catch (error) {
    console.error('❌ E2EE Test Error:', error.response?.data || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Random Group Chat Tests\n');
  console.log('📍 Server URL:', SERVER_URL);
  console.log('🎫 JWT Token:', JWT_TOKEN === 'your_jwt_token_here' ? 'Not provided' : 'Provided');
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test HTTP endpoints
  await testHttpEndpoints();
  
  // Test E2EE endpoints
  await testE2EEEndpoints();
  
  // Test Socket.IO connection
  testSocketConnection();
}

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted. Exiting...');
  process.exit(0);
});

// Run tests
runTests().catch(console.error); 