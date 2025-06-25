import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Add new columns to groups table
  await queryInterface.addColumn("groups", "status", {
    type: DataTypes.ENUM("waiting", "active", "sealed", "inactive"),
    allowNull: false,
    defaultValue: "waiting",
  });

  await queryInterface.addColumn("groups", "min_members_to_start", {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
  });

  // Update existing groups to have 'active' status
  await queryInterface.sequelize.query(
    "UPDATE groups SET status = 'active' WHERE is_active = true"
  );
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeColumn("groups", "status");
  await queryInterface.removeColumn("groups", "min_members_to_start");
} 