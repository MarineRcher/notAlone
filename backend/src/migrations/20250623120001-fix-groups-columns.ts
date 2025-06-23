import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
    // No changes needed - groups table already has snake_case columns
    console.log('Groups table already has correct snake_case columns - skipping migration');
  },

  async down(queryInterface: QueryInterface) {
    // No changes needed - groups table already has snake_case columns
    console.log('Groups table already has correct snake_case columns - skipping rollback');
  }
}; 