'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create real bcrypt hash for password "test123"
    const testPassword = await bcrypt.hash('test123', 10);
    
    // Create test users for development and testing
    const testUsers = [
      {
        id: 1001,
        login: 'alice',
        email: 'alice@test.dev',
        password: testPassword, // Real bcrypt hash for "test123"
        has_premium: false,
        has_2fa: false,
        is_blocked: false,
        notify: true,
        hour_notify: '09:00:00',
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 1002,
        login: 'bob',
        email: 'bob@test.dev',
        password: testPassword, // Real bcrypt hash for "test123"
        has_premium: false,
        has_2fa: false,
        is_blocked: false,
        notify: true,
        hour_notify: '10:00:00',
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 1003,
        login: 'charlie',
        email: 'charlie@test.dev',
        password: testPassword, // Real bcrypt hash for "test123"
        has_premium: true,
        has_2fa: false,
        is_blocked: false,
        notify: true,
        hour_notify: '11:00:00',
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 1004,
        login: 'diana',
        email: 'diana@test.dev',
        password: testPassword, // Real bcrypt hash for "test123"
        has_premium: false,
        has_2fa: true,
        two_factor_secret: 'MOCK2FASECRET1234567890ABCDEF',
        is_blocked: false,
        notify: false,
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 1005,
        login: 'eve',
        email: 'eve@test.dev',
        password: testPassword, // Real bcrypt hash for "test123"
        has_premium: true,
        has_2fa: false,
        is_blocked: false,
        notify: true,
        hour_notify: '14:00:00',
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert test users, but skip if they already exist
    for (const user of testUsers) {
      const exists = await queryInterface.rawSelect('users', {
        where: { id: user.id }
      }, ['id']);
      
      if (!exists) {
        await queryInterface.bulkInsert('users', [user]);
        console.log(`✅ Created test user: ${user.login} (ID: ${user.id}) - Password: test123`);
      } else {
        console.log(`⏭️  Test user already exists: ${user.login} (ID: ${user.id})`);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove test users by their IDs
    await queryInterface.bulkDelete('users', {
      id: [1001, 1002, 1003, 1004, 1005]
    });
  }
}; 