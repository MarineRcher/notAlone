import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
    await queryInterface.createTable("messages", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      group_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "groups",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      encrypted_content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: "Serialized encrypted message from frontend"
      },
      message_type: {
        type: DataTypes.ENUM("text", "system", "key_exchange"),
        defaultValue: "text",
        allowNull: false
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      is_delivered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Create indexes
    await queryInterface.addIndex("messages", ["group_id", "timestamp"]);
    await queryInterface.addIndex("messages", ["sender_id"]);
    await queryInterface.addIndex("messages", ["message_type"]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("messages");
  }
}; 