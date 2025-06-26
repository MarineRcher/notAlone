import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
    // Create real bcrypt hash for password "test123"
    const testPassword = await bcrypt.hash('test123', 10);
    
    // Create test users for development and testing
    const testUsers = [
      {
        id: uuidv4(),
        login: 'alice',
        email: 'alice@test.dev',
        password: testPassword, // Real bcrypt hash for "test123"
        has_premium: false,
        has2_f_a: false,
        is_blocked: false,
        notify: true,
        hour_notify: '09:00:00',
        failed_login_attempts: 0,
        points: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        login: 'bob',
        email: 'bob@test.dev',
        password: testPassword, // Real bcrypt hash for "test123"
        has_premium: false,
        has2_f_a: false,
        is_blocked: false,
        notify: true,
        hour_notify: '10:00:00',
        failed_login_attempts: 0,
        points: 50,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        login: 'charlie',
        email: 'charlie@test.dev',
        password: testPassword, // Real bcrypt hash for "test123"
        has_premium: true,
        has2_f_a: false,
        is_blocked: false,
        notify: true,
        hour_notify: '11:00:00',
        failed_login_attempts: 0,
        points: 120,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        login: 'diana',
        email: 'diana@test.dev',
        password: testPassword, // Real bcrypt hash for "test123"
        has_premium: false,
        has2_f_a: true,
        two_factor_secret: 'MOCK2FASECRET1234567890ABCDEF',
        is_blocked: false,
        notify: false,
        failed_login_attempts: 0,
        points: 25,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        login: 'eve',
        email: 'eve@test.dev',
        password: testPassword, // Real bcrypt hash for "test123"
        has_premium: true,
        has2_f_a: false,
        is_blocked: false,
        notify: true,
        hour_notify: '14:00:00',
        failed_login_attempts: 0,
        points: 200,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert test users, but skip if they already exist
    for (const user of testUsers) {
      try {
        const exists = await queryInterface.rawSelect('users', {
          where: { email: user.email }
        }, ['id']);
        
        if (!exists) {
          await queryInterface.bulkInsert('users', [user]);
          console.log(`✅ Created test user: ${user.login} (${user.email}) - Password: test123`);
        } else {
          console.log(`⏭️  Test user already exists: ${user.login} (${user.email})`);
        }
      } catch (error) {
        console.error(`❌ Error creating user ${user.login}:`, error);
      }
    }
  },

  async down(queryInterface: QueryInterface) {
    // Remove test users by email
    const testEmails = [
      'alice@test.dev',
      'bob@test.dev', 
      'charlie@test.dev',
      'diana@test.dev',
      'eve@test.dev'
    ];

    await queryInterface.bulkDelete('users', {
      email: testEmails
    });

    console.log('🗑️  Removed test users');
  }
};