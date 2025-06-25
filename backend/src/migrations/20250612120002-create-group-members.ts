import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
    await queryInterface.createTable("group_members", {
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
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      role: {
        type: DataTypes.ENUM("admin", "member"),
        defaultValue: "member",
        allowNull: false
      },
      joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      publicKey: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Base64 encoded public key for e2ee"
      },
      lastSeenAt: {
        type: DataTypes.DATE,
        allowNull: true
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
    await queryInterface.addIndex("group_members", ["groupId", "userId"], {
      unique: true,
      name: "unique_group_user"
    });
    await queryInterface.addIndex("group_members", ["userId", "isActive"]);
    await queryInterface.addIndex("group_members", ["groupId", "isActive"]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("group_members");
  }
}; 