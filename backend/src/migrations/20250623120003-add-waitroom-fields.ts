import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {

  await queryInterface.sequelize.query(
    "UPDATE groups SET status = 'active' WHERE is_active = true"
  );
}

export async function down(queryInterface: QueryInterface): Promise<void> {
 
} 