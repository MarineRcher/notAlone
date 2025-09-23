import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.createTable("sponsor_messages", {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            sponsorship_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "sponsors",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            sender_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            encrypted_content: {
                type: DataTypes.TEXT,
                allowNull: false,
                comment: "Serialized encrypted message from frontend",
            },
            message_type: {
                type: DataTypes.ENUM("text", "system", "key_exchange"),
                defaultValue: "text",
            },
            timestamp: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            is_delivered: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
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

        // Create indexes for performance using correct snake_case column names
        await queryInterface.addIndex("sponsor_messages", {
            fields: ["sponsorship_id", "timestamp"],
            name: "sponsor_messages_sponsorship_id_timestamp"
        });
        await queryInterface.addIndex("sponsor_messages", {
            fields: ["sender_id"],
            name: "sponsor_messages_sender_id"
        });
        await queryInterface.addIndex("sponsor_messages", {
            fields: ["message_type"],
            name: "sponsor_messages_message_type"
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("sponsor_messages");
    },
}; 