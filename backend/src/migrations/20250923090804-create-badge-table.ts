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
			description: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			timeInDays: {
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
				name: "1",
				url: "/static/badges/1.svg",
				description: "La graine qui germe : Tu viens de planter la graine du changement. Ce n’est que le début, mais tout commence ici. La volonté de transformation est en toi.",
				timeInDays: 3,
				created_at: now,
				updated_at: now,
			},
			{
				badge_id: uuidv4(),
				name: "2",
				url: "/static/badges/2.svg",
				description: "La feuille nouvelle : Une première pousse émerge. Chaque jour sans l’addiction te renforce, comme une jeune feuille s’ouvrant à la lumière. Tu commences à respirer plus librement.",
				timeInDays: 7,
				created_at: now,
				updated_at: now,
			},
			{
				badge_id: uuidv4(),
				name: "3",
				url: "/static/badges/3.svg",
				description: "Le Jeune Arbrisseau : Un mois de constance. Tu es maintenant solidement enraciné dans ton choix. La croissance est lente mais réelle.",
				timeInDays: 31,
				created_at: now,
				updated_at: now,
			},
			{
				badge_id: uuidv4(),
				name: "4",
				url: "/static/badges/4.svg",
				description: "Le Pin Résilient : Face au vent, tu tiens bon. Le pin incarne la résilience : enraciné profondément, il traverse les saisons. Tu as traversé un cycle complet de transformation.",
				timeInDays: 92,
				created_at: now,
				updated_at: now,
			},
			{
				badge_id: uuidv4(),
				name: "5",
				url: "/static/badges/5.svg",
				description: "Le Pin Résilient : Face au vent, tu tiens bon. Le pin incarne la résilience : enraciné profondément, il traverse les saisons. Tu as traversé un cycle complet de transformation.",
				timeInDays: 184,
				created_at: now,
				updated_at: now,
			},
			{
				badge_id: uuidv4(),
				name: "6",
				url: "/static/badges/6.svg",
				description: "Le Pin Résilient : Face au vent, tu tiens bon. Le pin incarne la résilience : enraciné profondément, il traverse les saisons. Tu as traversé un cycle complet de transformation.",
				timeInDays: 276,
				created_at: now,
				updated_at: now,
			},
			{
				badge_id: uuidv4(),
				name: "7",
				url: "/static/badges/7.svg",
				description: "Le Pin Résilient : Face au vent, tu tiens bon. Le pin incarne la résilience : enraciné profondément, il traverse les saisons. Tu as traversé un cycle complet de transformation.",
				timeInDays: 365,
				created_at: now,
				updated_at: now,
			},
		]);
	},

	async down(queryInterface: QueryInterface) {
		await queryInterface.dropTable("badges");
	},
};
