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

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
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
        },
        has2FA: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        twoFactorSecret: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isBlocked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        notify: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        hourNotify: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        failedLoginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        blockedUntil: {
            type: DataTypes.DATE,
            allowNull: true,
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
