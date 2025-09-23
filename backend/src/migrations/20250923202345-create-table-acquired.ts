import { QueryInterface, DataTypes, QueryTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { AddictionAttributes } from "../types/addiction";

export default {
	async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
		const now = new Date();
		await queryInterface.createTable("acquired", {
			acquired_id: {
				type: DataTypes.UUID,
				primaryKey: true,
				defaultValue: DataTypes.UUIDV4,
				allowNull: false,
			},
			addiction_id: {
				type: DataTypes.UUID,
				allowNull: false,
			},
			acquired: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			number: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			unity: {
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
		interface AddictionRow {
			id: string;
			addiction: string;
		}
		const result = await queryInterface.sequelize.query(
			"SELECT id, addiction FROM addictions",
			{ type: QueryTypes.SELECT, raw: true },
		);
		const addictionsData = result as unknown as AddictionRow[];

		const addictionsMap = addictionsData.reduce(
			(acc, addiction) => {
				acc[addiction.addiction] = addiction.id;
				return acc;
			},
			{} as Record<string, string>,
		);
		await queryInterface.bulkInsert("acquired", [
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Tabac"],
				acquired:
					"Tension artérielle et fréquence cardiaque reviennent à la normale.",
				number: 20,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Tabac"],
				acquired:
					"Tension artérielle et fréquence cardiaque reviennent à la normale.",
				number: 480,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Tabac"],
				acquired:
					"Le monoxyde de carbone est éliminé, les poumons commencent à se nettoyer.",
				number: 1440,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Tabac"],
				acquired: "La respiration est plus facile, plus d’oxygène disponible.",
				number: 4320,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Tabac"],
				acquired: "Amélioration du souffle, moins de fatigue.",
				number: 30240,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
		]);
	},

	async down(queryInterface: QueryInterface) {
		await queryInterface.dropTable("acquired");
	},
};
