import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        // Add role_id column to users table
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
    },

    async down(queryInterface: QueryInterface) {
        // Remove constraint and column
        await queryInterface.removeConstraint("users", "fk_users_role_id");
        await queryInterface.removeColumn("users", "role_id");
    },
}; 