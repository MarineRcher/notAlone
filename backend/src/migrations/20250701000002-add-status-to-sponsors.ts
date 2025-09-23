import { QueryInterface, DataTypes } from "sequelize";

export default {
	async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
		// Check if status column already exists
		const tableDescription = await queryInterface.describeTable("sponsors");
		
		if (!tableDescription.status) {
			await queryInterface.addColumn("sponsors", "status", {
				type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
				defaultValue: 'accepted', // Existing relationships are considered accepted
				allowNull: false,
			});

			// No need for UPDATE query since the column has a default value
			// and allowNull: false, so all existing records will automatically get the default value
		}
	},

	async down(queryInterface: QueryInterface) {
		// Check if column exists before trying to remove it
		const tableDescription = await queryInterface.describeTable("sponsors");
		
		if (tableDescription.status) {
			await queryInterface.removeColumn("sponsors", "status");
		}
	},
}; 