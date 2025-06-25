import { Model, DataTypes, Optional } from "sequelize";
import db from "../config/database";
import { JournalAttributes } from "../types/journal";

interface JournalCreationAttributes
    extends Optional<JournalAttributes, "id_journal"> {}

class Journal
    extends Model<JournalAttributes, JournalCreationAttributes>
    implements JournalAttributes
{
    declare id_journal: number;
    declare id_user: number;
    declare difficulty: "Facile" | "Moyen" | "Dur";
    declare consumed?: boolean;
    declare id_resume_journey?: number;
    declare note?: string | undefined;
    declare next_day_goal?: string | undefined;
    declare actual_day_goal_completed?: boolean | undefined;
    declare created_at: Date;
    declare have_points?: boolean | undefined;
    declare readonly updatedAt: Date;

    static associate(models: any) {
        Journal.belongsTo(models.User, {
            foreignKey: "id_user",
            as: "user",
            onDelete: "CASCADE",
        });

        Journal.belongsTo(models.ResumeJourney, {
            foreignKey: "id_resume_journey",
            as: "resume_journey",
        });
    }
}

Journal.init(
    {
        id_journal: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        difficulty: {
            type: DataTypes.ENUM("Facile", "Moyen", "Dur"),
            allowNull: false,
        },
        consumed: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        id_resume_journey: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        note: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        next_day_goal: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                notEmpty: true,
                len: [1, 255],
            },
        },
        actual_day_goal_completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        have_points: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        created_at: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize: db,
        modelName: "Journal",
        tableName: "journal",
        timestamps: true,
        createdAt: "created_at",
        hooks: {
            beforeCreate: (journal: Journal) => {
                if (!journal.getDataValue("created_at")) {
                    journal.setDataValue("created_at", new Date());
                }
            },
        },
    }
);

export default Journal;
