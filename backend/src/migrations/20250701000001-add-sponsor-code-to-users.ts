import { QueryInterface, DataTypes } from "sequelize";

export default {
	async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
		// Check if sponsor_code column already exists
		const tableDescription = await queryInterface.describeTable("users");
		
		if (!tableDescription.sponsor_code) {
			// Generate random 8-digit codes for existing users
			const generateSponsorCode = (): string => {
				return Math.floor(10000000 + Math.random() * 90000000).toString();
			};

			// Add the sponsor_code column
			await queryInterface.addColumn("users", "sponsor_code", {
				type: DataTypes.STRING(8),
				allowNull: true, // Temporarily allow null for existing records
				unique: true,
				validate: {
					len: [8, 8],
					isNumeric: true,
				},
			});

			// Get all existing users and assign unique sponsor codes
			const [users] = await queryInterface.sequelize.query(
				"SELECT id FROM users"
			);

			const usedCodes = new Set<string>();
			
			for (const user of users as any[]) {
				let sponsorCode: string;
				do {
					sponsorCode = generateSponsorCode();
				} while (usedCodes.has(sponsorCode));
				
				usedCodes.add(sponsorCode);
				
				await queryInterface.sequelize.query(
					"UPDATE users SET sponsor_code = :sponsorCode WHERE id = :userId",
					{
						replacements: { sponsorCode, userId: user.id },
					}
				);
			}

			// Now make the column non-nullable
			await queryInterface.changeColumn("users", "sponsor_code", {
				type: DataTypes.STRING(8),
				allowNull: false,
				unique: true,
				validate: {
					len: [8, 8],
					isNumeric: true,
				},
			});

			// Index is already created by unique: true, no need to add it separately
		}
	},

	async down(queryInterface: QueryInterface) {
		// Check if column exists before trying to remove it
		const tableDescription = await queryInterface.describeTable("users");
		
		if (tableDescription.sponsor_code) {
			await queryInterface.removeColumn("users", "sponsor_code");
		}
	},
}; 