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
      groupId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "groups",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      encryptedContent: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: "Serialized encrypted message from frontend"
      },
      messageType: {
        type: DataTypes.ENUM("text", "system", "key_exchange"),
        defaultValue: "text",
        allowNull: false
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      isDelivered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Create indexes
    await queryInterface.addIndex("messages", ["groupId", "timestamp"]);
    await queryInterface.addIndex("messages", ["senderId"]);
    await queryInterface.addIndex("messages", ["messageType"]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("messages");
  }
}; 