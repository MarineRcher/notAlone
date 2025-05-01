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
    > {}
class User
    extends Model<UserAttributes, UserCreationAttributes>
    implements UserAttributes
{
    public id!: number;
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

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
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
    },
    {
        sequelize: db,
        modelName: "User",
        tableName: "users",
        timestamps: true,
        underscored: true,
    }
);

export default User;
