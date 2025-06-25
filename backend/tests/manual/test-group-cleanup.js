const io = require('socket.io-client');

async function testGroupCleanup() {
  console.log('🧪 [GROUP-CLEANUP] Starting group cleanup test...');
  
  // Create connections
  const aliceSocket = io('http://localhost:3000', {
    auth: { token: 'mock:alice' }
  });
  
  const bobSocket = io('http://localhost:3000', {
    auth: { token: 'mock:bob' }
  });

  const testGroupId = 'test-cleanup-group';
  
  return new Promise((resolve, reject) => {
    let aliceConnected = false;
    let bobConnected = false;
    let aliceJoined = false;
    let bobJoined = false;
    
    function checkProgress() {
      if (aliceConnected && bobConnected && aliceJoined && bobJoined) {
        console.log('✅ [GROUP-CLEANUP] Both users joined, starting cleanup test...');
        setTimeout(testGroupLeaving, 2000);
      }
    }
    
    function testGroupLeaving() {
      console.log('🚪 [GROUP-CLEANUP] Testing group leaving...');
      
      // Alice leaves first
      console.log('👤 [GROUP-CLEANUP] Alice leaving group...');
      aliceSocket.emit('leave_group', { groupId: testGroupId });
      
      setTimeout(() => {
        // Bob leaves second (group should be deleted)
        console.log('👤 [GROUP-CLEANUP] Bob leaving group (should trigger cleanup)...');
        bobSocket.emit('leave_group', { groupId: testGroupId });
        
        setTimeout(() => {
          console.log('✅ [GROUP-CLEANUP] Test completed! Check server logs for cleanup messages.');
          aliceSocket.disconnect();
          bobSocket.disconnect();
          resolve();
        }, 3000);
      }, 2000);
    }
    
    // Alice connection
    aliceSocket.on('connect', () => {
      console.log('✅ [GROUP-CLEANUP] Alice connected');
      aliceConnected = true;
      
      aliceSocket.emit('join_group', { groupId: testGroupId });
    });
    
    aliceSocket.on('group_members', (data) => {
      console.log('👥 [GROUP-CLEANUP] Alice got group members:', data.members.length);
      aliceJoined = true;
      checkProgress();
    });
    
    // Bob connection
    bobSocket.on('connect', () => {
      console.log('✅ [GROUP-CLEANUP] Bob connected');
      bobConnected = true;
      
      bobSocket.emit('join_group', { groupId: testGroupId });
    });
    
    bobSocket.on('group_members', (data) => {
      console.log('👥 [GROUP-CLEANUP] Bob got group members:', data.members.length);
      bobJoined = true;
      checkProgress();
    });
    
    // Event listeners
    aliceSocket.on('member_joined', (data) => {
      console.log('👤 [GROUP-CLEANUP] Alice saw member joined:', data.username);
    });
    
    aliceSocket.on('member_left', (data) => {
      console.log('🚪 [GROUP-CLEANUP] Alice saw member left:', data.username);
    });
    
    bobSocket.on('member_joined', (data) => {
      console.log('👤 [GROUP-CLEANUP] Bob saw member joined:', data.username);
    });
    
    bobSocket.on('member_left', (data) => {
      console.log('🚪 [GROUP-CLEANUP] Bob saw member left:', data.username);
    });
    
    // Error handling
    aliceSocket.on('connect_error', (error) => {
      console.error('❌ [GROUP-CLEANUP] Alice connection error:', error);
      reject(error);
    });
    
    bobSocket.on('connect_error', (error) => {
      console.error('❌ [GROUP-CLEANUP] Bob connection error:', error);
      reject(error);
    });
    
    setTimeout(() => {
      reject(new Error('Test timeout'));
    }, 30000);
  });
}

// Run test
testGroupCleanup()
  .then(() => {
    console.log('🎉 [GROUP-CLEANUP] Test completed successfully!');
    console.log('📋 [GROUP-CLEANUP] Expected behavior:');
    console.log('   - Two users join a group');
    console.log('   - First user leaves (group still exists)');
    console.log('   - Second user leaves (group gets deleted from database)');
    console.log('   - Check server logs for cleanup messages');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ [GROUP-CLEANUP] Test failed:', error);
    process.exit(1);
  }); 