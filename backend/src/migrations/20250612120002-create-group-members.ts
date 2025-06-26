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
      group_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "groups",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      user_id: {
        type: DataTypes.UUID,
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
      joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      public_key: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Base64 encoded public key for e2ee"
      },
      last_seen_at: {
        type: DataTypes.DATE,
        allowNull: true
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
    await queryInterface.addIndex("group_members", ["group_id", "user_id"], {
      unique: true,
      name: "unique_group_user"
    });
    await queryInterface.addIndex("group_members", ["user_id", "is_active"]);
    await queryInterface.addIndex("group_members", ["group_id", "is_active"]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("group_members");
  }
}; 