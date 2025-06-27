import { QueryInterface, DataTypes } from "sequelize";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        await queryInterface.addColumn("sponsors", "sponsor_public_key", {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Sponsor's public key for E2EE communication",
        });

        await queryInterface.addColumn("sponsors", "user_public_key", {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "User's public key for E2EE communication",
        });

        await queryInterface.addColumn("sponsors", "key_exchange_complete", {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: "Whether both parties have exchanged their public keys",
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.removeColumn("sponsors", "sponsor_public_key");
        await queryInterface.removeColumn("sponsors", "user_public_key");
        await queryInterface.removeColumn("sponsors", "key_exchange_complete");
    },
}; 