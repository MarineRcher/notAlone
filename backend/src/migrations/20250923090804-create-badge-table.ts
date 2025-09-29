import { QueryInterface, DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export default {
	async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
		const now = new Date();
		await queryInterface.createTable("badges", {
			badge_id: {
				type: DataTypes.UUID,
				primaryKey: true,
				allowNull: false,
				defaultValue: DataTypes.UUIDV4,
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			time_in_days: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			url: {
				type: DataTypes.STRING,
				allowNull: false,
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
		await queryInterface.bulkInsert("badges", [
			{
				badge_id: uuidv4(),
				name: "La graine qui germe",
				url: "/static/badges/1.svg",
				time_in_days: 3,
				created_at: now,
				updated_at: now,
			},
			{
				badge_id: uuidv4(),
				name: "La feuille nouvelle",
				url: "/static/badges/2.svg",
				time_in_days: 7,
				created_at: now,
				updated_at: now,
			},
			{
				badge_id: uuidv4(),
				name: "Le Jeune Arbrisseau",
				url: "/static/badges/3.svg",
				time_in_days: 31,
				created_at: now,
				updated_at: now,
			},
			{
				badge_id: uuidv4(),
				name: "La branche vigoureuse",
				url: "/static/badges/4.svg",
				time_in_days: 92,
				created_at: now,
				updated_at: now,
			},
			{
				badge_id: uuidv4(),
				name: "Le Pin Résilient",
				url: "/static/badges/5.svg",
				time_in_days: 184,
				created_at: now,
				updated_at: now,
			},
			{
				badge_id: uuidv4(),
				name: "La forêt naissante",
				url: "/static/badges/6.svg",
				time_in_days: 276,
				created_at: now,
				updated_at: now,
			},
			{
				badge_id: uuidv4(),
				name: "L'arc-en-ciel",
				url: "/static/badges/7.svg",
				time_in_days: 365,
				created_at: now,
				updated_at: now,
			},
		]);
	},

	async down(queryInterface: QueryInterface) {
		await queryInterface.dropTable("badges");
	},
};
