import { QueryInterface, DataTypes, QueryTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";

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
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Tabac"],
				acquired: "Risque d’infarctus divisé par 2.",
				number: 525600,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Tabac"],
				acquired: "Risque d’AVC redevenu équivalent à celui d’un non-fumeur.",
				number: 2628000,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Tabac"],
				acquired: "Risque de cancer du poumon réduit de moitié.",
				number: 5256000,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Alcool"],
				acquired: "Le foie commence à se régénérer, sommeil plus profond.",
				number: 2880,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Alcool"],
				acquired: "Meilleure concentration, humeur plus stable.",
				number: 10080,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Alcool"],
				acquired: "Meilleure digestion, moins de ballonnements, teint plus clair.",
				number: 20160,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Alcool"],
				acquired: "Perte de poids, diminution de la tension artérielle.",
				number: 43830,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Alcool"],
				acquired: "Le foie a réparé une grande partie des dommages.",
				number: 131490,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Alcool"],
				acquired: "Baisse du risque de cancers, du foie, du sein, etc.",
				number: 262980,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Alcool"],
				acquired: "Système immunitaire renforcé, meilleure qualité de vie globale.",
				number: 525600,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Jeux d'argent"],
				acquired: "Moins de stress lié à la perte d’argent, sommeil plus stable.",
				number: 10080,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Jeux d'argent"],
				acquired: "Diminution de l’anxiété, retour du plaisir dans d’autres activités.",
				number: 20160,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Jeux d'argent"],
				acquired: "Amélioration des relations sociales, meilleure estime de soi.",
				number: 43830,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Jeux d'argent"],
				acquired: "Reprise du contrôle financier, moins de dettes.",
				number: 262980,
				unity: "mn",
				created_at: now,
				updated_at: now,
			},
			{
				acquired_id: uuidv4(),
				addiction_id: addictionsMap["Jeux d'argent"],
				acquired: "Réduction du risque de rechute, stabilité psychologique retrouvée.",
				number: 525600,
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
