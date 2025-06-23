import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.createTable("addiction_users", {
            // PLURIEL pour cohérence
            id_addiction_user: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            id_addiction: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "addictions",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            id_user: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            spending_a_day: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
            use_a_day: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
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

        await queryInterface.addIndex("addiction_users", ["id_addiction"]);
        await queryInterface.addIndex("addiction_users", ["id_user"]);

        await queryInterface.addIndex(
            "addiction_users",
            ["id_user", "id_addiction", "date"],
            {
                unique: true,
                name: "unique_user_addiction_date",
            }
        );
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("addiction_users");
    },
};
