import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";
import { UserAttributes } from "../types/users";
import Role from "./Role";
import Sponsor from "./Sponsor";

interface UserCreationAttributes
	extends Optional<
		UserAttributes,
		| "id"
		| "hasPremium"
		| "has2FA"
		| "isBlocked"
		| "notify"
		| "twoFactorSecret"
		| "hourNotify"
		| "failedLoginAttempts"
		| "blockedUntil"
		| "points"
		| "roleId"
	> {}

class User
	extends Model<UserAttributes, UserCreationAttributes>
	implements UserAttributes
{
	public id!: string;
	public login!: string;
	public email!: string;
	public password!: string;
	public hasPremium!: boolean;
	public has2FA!: boolean;
	public twoFactorSecret!: string | null;
	public isBlocked!: boolean;
	public notify!: boolean;
	public hourNotify!: Date | null;
	public failedLoginAttempts!: number;
	public blockedUntil!: Date | null;
	public points!: number;
	public roleId!: number;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

User.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4,
			allowNull: false,
		},
		login: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true,
			},
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		hasPremium: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: "has_premium",
		},
		has2FA: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: "has2_f_a",
		},
		twoFactorSecret: {
			type: DataTypes.STRING,
			allowNull: true,
			field: "two_factor_secret",
		},
		isBlocked: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: "is_blocked",
		},
		notify: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		hourNotify: {
			type: DataTypes.TIME,
			allowNull: true,
			field: "hour_notify",
		},
		failedLoginAttempts: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: "failed_login_attempts",
		},
		blockedUntil: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "blocked_until",
		},
		points: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		roleId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
			field: "role_id",
			references: {
				model: "roles",
				key: "id",
			},
		},
	},
	{
		sequelize: db,
		modelName: "User",
		tableName: "users",
		timestamps: true,
	},
);

// Define associations
User.belongsTo(Role, {
	foreignKey: 'roleId',
	as: 'role',
});

Role.hasMany(User, {
	foreignKey: 'roleId',
	as: 'users',
});

// User can have one sponsor
User.hasOne(Sponsor, {
	foreignKey: 'userId',
	as: 'sponsorship',
});

// User can be a sponsor to many users
User.hasMany(Sponsor, {
	foreignKey: 'sponsorId',
	as: 'sponsoredUsers',
});

// Sponsor associations
Sponsor.belongsTo(User, {
	foreignKey: 'sponsorId',
	as: 'sponsor',
});

Sponsor.belongsTo(User, {
	foreignKey: 'userId',
	as: 'user',
});

export default User;
