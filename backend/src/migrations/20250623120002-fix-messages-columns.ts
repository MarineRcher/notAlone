import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
    // Rename columns from camelCase to snake_case to match model field mappings
    await queryInterface.renameColumn('messages', 'groupId', 'group_id');
    await queryInterface.renameColumn('messages', 'senderId', 'sender_id');
    await queryInterface.renameColumn('messages', 'encryptedContent', 'encrypted_content');
    await queryInterface.renameColumn('messages', 'messageType', 'message_type');
    await queryInterface.renameColumn('messages', 'isDelivered', 'is_delivered');
    await queryInterface.renameColumn('messages', 'createdAt', 'created_at');
    await queryInterface.renameColumn('messages', 'updatedAt', 'updated_at');
  },

  async down(queryInterface: QueryInterface) {
    // Rename columns back from snake_case to camelCase
    await queryInterface.renameColumn('messages', 'group_id', 'groupId');
    await queryInterface.renameColumn('messages', 'sender_id', 'senderId');
    await queryInterface.renameColumn('messages', 'encrypted_content', 'encryptedContent');
    await queryInterface.renameColumn('messages', 'message_type', 'messageType');
    await queryInterface.renameColumn('messages', 'is_delivered', 'isDelivered');
    await queryInterface.renameColumn('messages', 'created_at', 'createdAt');
    await queryInterface.renameColumn('messages', 'updated_at', 'updatedAt');
  }
}; 