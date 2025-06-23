import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        // Add missing columns
        try {
            await queryInterface.addColumn("users", "failed_login_attempts", {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            });
        } catch (error) {
            console.log("failed_login_attempts column already exists or error:", error);
        }

        try {
            await queryInterface.addColumn("users", "blocked_until", {
                type: DataTypes.DATE,
                allowNull: true,
            });
        } catch (error) {
            console.log("blocked_until column already exists or error:", error);
        }

        // Rename the incorrectly named column
        try {
            await queryInterface.renameColumn("users", "has2_f_a", "has_2fa");
        } catch (error) {
            console.log("Column rename failed or already correct:", error);
        }
    },

    async down(queryInterface: QueryInterface) {
        // Remove the added columns
        await queryInterface.removeColumn("users", "failed_login_attempts");
        await queryInterface.removeColumn("users", "blocked_until");
        
        // Rename back
        await queryInterface.renameColumn("users", "has_2fa", "has2_f_a");
    },
}; 