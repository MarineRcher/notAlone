import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        // Check if role_id column already exists
        const tableDescription = await queryInterface.describeTable("users");
        
        if (!tableDescription.role_id) {
            // Add role_id column to users table only if it doesn't exist
            await queryInterface.addColumn("users", "role_id", {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1, // Default to 'user' role
                references: {
                    model: "roles",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT",
            });

            // Add foreign key constraint
            await queryInterface.addConstraint("users", {
                fields: ["role_id"],
                type: "foreign key",
                name: "fk_users_role_id",
                references: {
                    table: "roles",
                    field: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT",
            });

            // Add index for performance
            await queryInterface.addIndex("users", ["role_id"]);
        }
    },

    async down(queryInterface: QueryInterface) {
        // Check if column exists before trying to remove it
        const tableDescription = await queryInterface.describeTable("users");
        
        if (tableDescription.role_id) {
            // Remove constraint and column only if they exist
            try {
                await queryInterface.removeConstraint("users", "fk_users_role_id");
            } catch (error) {
                // Constraint might not exist, ignore error
                console.log("Constraint fk_users_role_id not found, skipping...");
            }
            await queryInterface.removeColumn("users", "role_id");
        }
    },
}; 