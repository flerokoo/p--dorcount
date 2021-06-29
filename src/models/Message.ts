import { Sequelize, DataTypes, Model } from "sequelize";
import { Message } from "../domain/Message";

interface MessageAttributes extends Message {
  createdAt?: Date;
  updatedAt?: Date;
}

interface MessageCreationAttributes extends MessageAttributes {}

export interface MessageInstance
  extends Model<MessageAttributes, MessageCreationAttributes> {}

export const defineMessageModel = (db: Sequelize) => {
  const Message = db.define<MessageInstance>(
    "Message",
    {
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: false
      },
      chatId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: false,
      },
      dayOfWeek: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        unique: false
      },
    },
    {
      indexes: [
        {
          unique: false,
          fields: ["chatId"],
          
        },
        {
          fields: ["dayOfWeek"]
        }, 
        {
          fields: ["userId"]
        },
        {
          fields: ["createdAt"]
        }
      ],
    }
  );

  return Message;
};
