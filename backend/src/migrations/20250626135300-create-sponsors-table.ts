import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.createTable("sponsors", {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            sponsor_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true, // A user can have only one sponsor
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            started_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            ended_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        });

        // Add indexes for performance (foreign key constraints are already defined in column definitions)
        await queryInterface.addIndex("sponsors", ["sponsor_id"]);
        await queryInterface.addIndex("sponsors", ["user_id"], { unique: true });
        await queryInterface.addIndex("sponsors", ["is_active"]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("sponsors");
    },
}; 