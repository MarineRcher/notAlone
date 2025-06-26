import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";

export interface SponsorAttributes {
	id: number;
	sponsorId: string;
	userId: string;
	startedAt: Date;
	endedAt?: Date;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

interface SponsorCreationAttributes
	extends Optional<SponsorAttributes, "id" | "endedAt" | "isActive"> {}

class Sponsor
	extends Model<SponsorAttributes, SponsorCreationAttributes>
	implements SponsorAttributes
{
	public id!: number;
	public sponsorId!: string;
	public userId!: string;
	public startedAt!: Date;
	public endedAt?: Date;
	public isActive!: boolean;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

Sponsor.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
		},
		sponsorId: {
			type: DataTypes.UUID,
			allowNull: false,
			field: "sponsor_id",
			references: {
				model: "users",
				key: "id",
			},
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
			unique: true,
			field: "user_id",
			references: {
				model: "users",
				key: "id",
			},
		},
		startedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
			field: "started_at",
		},
		endedAt: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "ended_at",
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			field: "is_active",
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false,
		},
	},
	{
		sequelize: db,
		modelName: "Sponsor",
		tableName: "sponsors",
		timestamps: true,
	},
);

export default Sponsor; 