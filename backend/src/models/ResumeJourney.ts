import { Model, DataTypes, Optional } from "sequelize";
import db from "../config/database";
import { ResumeJourneyAttributes } from "../types/journal";

interface ResumeJourneyCreationAttributes
	extends Optional<ResumeJourneyAttributes, "id_resume_journey"> {}

class ResumeJourney
	extends Model<ResumeJourneyAttributes, ResumeJourneyCreationAttributes>
	implements ResumeJourneyAttributes
{
	declare id_resume_journey: string;
	declare resume_journey: string;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

ResumeJourney.init(
	{
		id_resume_journey: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4,
			allowNull: false,
		},
		resume_journey: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true,
				len: [1, 255],
			},
		},
	},
	{
		sequelize: db,
		modelName: "ResumeJourney",
		tableName: "resume_journey",
		timestamps: true,
	},
);

export default ResumeJourney;
