import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        // Check if columns already exist
        const tableDescription = await queryInterface.describeTable("sponsors");
        
        if (!tableDescription.sponsor_public_key) {
            await queryInterface.addColumn("sponsors", "sponsor_public_key", {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: "Sponsor's public key for E2EE communication",
            });
        }

        if (!tableDescription.user_public_key) {
            await queryInterface.addColumn("sponsors", "user_public_key", {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: "User's public key for E2EE communication",
            });
        }

        if (!tableDescription.key_exchange_complete) {
            await queryInterface.addColumn("sponsors", "key_exchange_complete", {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                comment: "Whether both parties have exchanged their public keys",
            });
        }
    },

    async down(queryInterface: QueryInterface) {
        // Check if columns exist before trying to remove them
        const tableDescription = await queryInterface.describeTable("sponsors");
        
        if (tableDescription.sponsor_public_key) {
            await queryInterface.removeColumn("sponsors", "sponsor_public_key");
        }
        if (tableDescription.user_public_key) {
            await queryInterface.removeColumn("sponsors", "user_public_key");
        }
        if (tableDescription.key_exchange_complete) {
            await queryInterface.removeColumn("sponsors", "key_exchange_complete");
        }
    },
}; 