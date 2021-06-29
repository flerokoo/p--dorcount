import { Sequelize, DataTypes, Model } from "sequelize";
import { Birthday } from "../domain/Birthday";

interface BirthdayAttributes extends Birthday {
  createdAt?: Date;
  updatedAt?: Date;
}

interface BirthdayCreationAttributes extends BirthdayAttributes {}

export interface BirthdayInstance
  extends Model<BirthdayAttributes, BirthdayCreationAttributes> {}

export const defineBirthdayModel = (db: Sequelize) => {
  const Birthday = db.define<BirthdayInstance>(
    "Birthday",
    {
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      definedInChatId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      dayOfMonth: {
        type: DataTypes.SMALLINT,
        allowNull: false
      },
      month: {
        type: DataTypes.SMALLINT,
        allowNull: false
      }
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["userId"],
        },
        {
          fields: ["month", "dayOfMonth"]
        }
      ]
    }
  );

  return Birthday;
};
