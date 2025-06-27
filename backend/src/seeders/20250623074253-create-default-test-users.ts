import bcrypt from "bcryptjs";
import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
    // Create real bcrypt hash for password "test123"
    const testPassword = await bcrypt.hash('test123', 10);
    
    // Define known UUIDs for test users that match mock authentication
    const KNOWN_TEST_UUIDS = {
      alice: '10010000-0000-0000-0000-000000000001',
      bob: '10020000-0000-0000-0000-000000000002', 
      charlie: '10030000-0000-0000-0000-000000000003',
      sponsor: '10060000-0000-0000-0000-000000000006',
      association: '10070000-0000-0000-0000-000000000007'
    };
    
    // Create test users for development and testing
    const testUsers = [
      // 3 regular users
      {
        id: KNOWN_TEST_UUIDS.alice,
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
        role_id: 1, // user role
        sponsor_code: '10000001', // Unique 8-digit sponsor code
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: KNOWN_TEST_UUIDS.bob,
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
        role_id: 1, // user role
        sponsor_code: '10000002', // Unique 8-digit sponsor code
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: KNOWN_TEST_UUIDS.charlie,
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
        role_id: 1, // user role
        sponsor_code: '10000003', // Unique 8-digit sponsor code
        created_at: new Date(),
        updated_at: new Date()
      },
      // 1 sponsor
      {
        id: KNOWN_TEST_UUIDS.sponsor,
        login: 'sponsor_mike',
        email: 'mike.sponsor@test.dev',
        password: testPassword, // Real bcrypt hash for "test123"
        has_premium: true,
        has2_f_a: false,
        is_blocked: false,
        notify: true,
        hour_notify: '08:00:00',
        failed_login_attempts: 0,
        points: 500,
        role_id: 2, // sponsor role
        sponsor_code: '10000006', // Unique 8-digit sponsor code
        created_at: new Date(),
        updated_at: new Date()
      },
      // 1 association
      {
        id: KNOWN_TEST_UUIDS.association,
        login: 'association_admin',
        email: 'admin@association.dev',
        password: testPassword, // Real bcrypt hash for "test123"
        has_premium: true,
        has2_f_a: true,
        two_factor_secret: 'ASSOC2FASECRET1234567890ABCDEF',
        is_blocked: false,
        notify: true,
        hour_notify: '07:00:00',
        failed_login_attempts: 0,
        points: 1000,
        role_id: 3, // association role
        sponsor_code: '10000007', // Unique 8-digit sponsor code
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
          console.log(`✅ Created test user: ${user.login} (${user.email}) - Password: test123 - Sponsor Code: ${user.sponsor_code}`);
        } else {
          console.log(`⏭️  Test user already exists: ${user.login} (${user.email})`);
        }
      } catch (error) {
        console.error(`❌ Error creating user ${user.login}:`, error);
      }
    }

    // Create sponsor relationships - the sponsor sponsors the 3 users
    const sponsorRelationships = [
      {
        sponsor_id: KNOWN_TEST_UUIDS.sponsor,
        user_id: KNOWN_TEST_UUIDS.alice,
        started_at: new Date(),
        is_active: true,
        status: 'accepted', // Add default status for existing relationships
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        sponsor_id: KNOWN_TEST_UUIDS.sponsor,
        user_id: KNOWN_TEST_UUIDS.bob,
        started_at: new Date(),
        is_active: true,
        status: 'accepted', // Add default status for existing relationships
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        sponsor_id: KNOWN_TEST_UUIDS.sponsor,
        user_id: KNOWN_TEST_UUIDS.charlie,
        started_at: new Date(),
        is_active: true,
        status: 'accepted', // Add default status for existing relationships
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert sponsor relationships, but skip if they already exist
    for (const relationship of sponsorRelationships) {
      try {
        const exists = await queryInterface.rawSelect('sponsors', {
          where: { user_id: relationship.user_id }
        }, ['id']);
        
        if (!exists) {
          await queryInterface.bulkInsert('sponsors', [relationship]);
          console.log(`✅ Created sponsor relationship: sponsor ${relationship.sponsor_id} sponsors user ${relationship.user_id}`);
        } else {
          console.log(`⏭️  Sponsor relationship already exists for user ${relationship.user_id}`);
        }
      } catch (error) {
        console.error(`❌ Error creating sponsor relationship for user ${relationship.user_id}:`, error);
      }
    }
  },

  async down(queryInterface: QueryInterface) {
    // Define the same UUIDs used in up method
    const KNOWN_TEST_UUIDS = {
      alice: '10010000-0000-0000-0000-000000000001',
      bob: '10020000-0000-0000-0000-000000000002', 
      charlie: '10030000-0000-0000-0000-000000000003',
      sponsor: '10060000-0000-0000-0000-000000000006',
      association: '10070000-0000-0000-0000-000000000007'
    };

    // Remove sponsor relationships first
    const testUserIds = [
      KNOWN_TEST_UUIDS.alice,
      KNOWN_TEST_UUIDS.bob,
      KNOWN_TEST_UUIDS.charlie
    ];

    await queryInterface.bulkDelete('sponsors', {
      user_id: testUserIds
    });

    // Remove test users by UUID
    const testUserUuids = [
      KNOWN_TEST_UUIDS.alice,
      KNOWN_TEST_UUIDS.bob,
      KNOWN_TEST_UUIDS.charlie,
      KNOWN_TEST_UUIDS.sponsor,
      KNOWN_TEST_UUIDS.association
    ];

    await queryInterface.bulkDelete('users', {
      id: testUserUuids
    });

    console.log('🗑️  Removed test users and sponsor relationships');
  }
};