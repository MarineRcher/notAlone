import { Model, DataTypes, Optional } from 'sequelize';
import db from "./../config/database";

interface UserAttributes {
  id: number;
  login: string;
  email: string;
  password: string;
  hasPremium: boolean;
  has2FA: boolean;
  twoFactorSecret: string | null;
  isBlocked: boolean;
  notify: boolean;
  hourNotify: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'hasPremium' | 'has2FA' | 'isBlocked' | 'notify' | 'twoFactorSecret' | 'hourNotify'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
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
  },
  {
    sequelize: db,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: false,
  }
);

export default User;