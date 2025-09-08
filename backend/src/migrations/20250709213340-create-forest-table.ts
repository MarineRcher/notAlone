import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {

        await queryInterface.createTable("forest", {
          id_forest: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
          },
          x: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          y: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          id_user: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        id_nature: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
              model: "natures",
              key: "id_nature",
          }
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
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("forest");
},
};
