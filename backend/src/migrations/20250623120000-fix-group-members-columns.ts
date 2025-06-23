import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
    // Rename columns from camelCase to snake_case to match model field mappings
    await queryInterface.renameColumn('group_members', 'groupId', 'group_id');
    await queryInterface.renameColumn('group_members', 'userId', 'user_id');
    await queryInterface.renameColumn('group_members', 'joinedAt', 'joined_at');
    await queryInterface.renameColumn('group_members', 'isActive', 'is_active');
    await queryInterface.renameColumn('group_members', 'publicKey', 'public_key');
    await queryInterface.renameColumn('group_members', 'lastSeenAt', 'last_seen_at');
    await queryInterface.renameColumn('group_members', 'createdAt', 'created_at');
    await queryInterface.renameColumn('group_members', 'updatedAt', 'updated_at');
  },

  async down(queryInterface: QueryInterface) {
    // Rename columns back from snake_case to camelCase
    await queryInterface.renameColumn('group_members', 'group_id', 'groupId');
    await queryInterface.renameColumn('group_members', 'user_id', 'userId');
    await queryInterface.renameColumn('group_members', 'joined_at', 'joinedAt');
    await queryInterface.renameColumn('group_members', 'is_active', 'isActive');
    await queryInterface.renameColumn('group_members', 'public_key', 'publicKey');
    await queryInterface.renameColumn('group_members', 'last_seen_at', 'lastSeenAt');
    await queryInterface.renameColumn('group_members', 'created_at', 'createdAt');
    await queryInterface.renameColumn('group_members', 'updated_at', 'updatedAt');
  }
}; 