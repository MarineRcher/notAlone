import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
    await queryInterface.createTable("groups", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      max_members: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        allowNull: false,
        validate: {
          min: 2,
          max: 50
        }
      },
      current_members: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      status: {
        type: DataTypes.ENUM("waiting", "active", "sealed", "inactive"),
        allowNull: false,
        defaultValue: "waiting",
      },
      min_members_to_start: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 3,
		},
      is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.addIndex("groups", ["is_active", "is_public"]);
    await queryInterface.addIndex("groups", ["current_members", "max_members"]);
    
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("groups");
  }
}; 