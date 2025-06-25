import { Model, DataTypes, Optional } from "sequelize";
import db from "./../config/database";
import { UserAttributes } from "../types/users";

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
    > {}

class User
    extends Model<UserAttributes, UserCreationAttributes>
    implements UserAttributes {
    declare id: number;
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
    declare points!: number;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
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
            field: 'has_premium', // Map to the correct database column name
        },
        has2FA: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'has_2fa', // Map to the correct database column name
        },
        twoFactorSecret: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'two_factor_secret', // Map to the correct database column name
        },
        isBlocked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_blocked', // Map to the correct database column name
        },
        notify: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        hourNotify: {
            type: DataTypes.TIME,
            allowNull: true,
            field: 'hour_notify', // Map to the correct database column name
        },
        failedLoginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'failed_login_attempts', // Map to the correct database column name
        },
        blockedUntil: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'blocked_until', // Map to the correct database column name
        },
        points: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        sequelize: db,
        modelName: "User",
        tableName: "users",
        timestamps: true,
    }
);

export default User;
