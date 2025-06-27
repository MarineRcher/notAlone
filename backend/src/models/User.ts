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
		| "sponsorCode"
	> {}

class User
	extends Model<UserAttributes, UserCreationAttributes>
	implements UserAttributes
{
	declare id: string;
	declare login: string;
	declare email: string;
	declare password: string;
	declare hasPremium: boolean;
	declare has2FA: boolean;
	declare twoFactorSecret: string | null;
	declare isBlocked: boolean;
	declare notify: boolean;
	declare hourNotify: Date | null;
	declare failedLoginAttempts: number;
	declare blockedUntil: Date | null;
	declare points: number;
	declare roleId: number;
	declare sponsorCode: string;

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
		sponsorCode: {
			type: DataTypes.STRING(8),
			allowNull: false,
			unique: true,
			field: "sponsor_code",
			validate: {
				len: [8, 8],
				isNumeric: true,
			},
		},
	},
	{
		sequelize: db,
		modelName: "User",
		tableName: "users",
		timestamps: true,
		hooks: {
			beforeCreate: async (user: User) => {
				// Generate unique 8-digit sponsor code
				let sponsorCode: string;
				let isUnique = false;
				
				while (!isUnique) {
					sponsorCode = Math.floor(10000000 + Math.random() * 90000000).toString();
					const existingUser = await User.findOne({ where: { sponsorCode } });
					if (!existingUser) {
						isUnique = true;
						user.sponsorCode = sponsorCode;
					}
				}
			},
		},
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
