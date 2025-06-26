import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.createTable("roles", {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: {
                type: DataTypes.ENUM('user', 'sponsor', 'association'),
                allowNull: false,
                unique: true,
            },
            description: {
                type: DataTypes.STRING,
                allowNull: true,
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

        // Insert default roles
        await queryInterface.bulkInsert("roles", [
            {
                name: 'user',
                description: 'Regular user',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                name: 'sponsor',
                description: 'Sponsor who can mentor users',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                name: 'association',
                description: 'Association member',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("roles");
    },
}; 