import { Sequelize, DataTypes, ModelDefined, Model } from "sequelize";
import { User } from "../domain/User";

interface UserAttributes extends User {
  fake: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends UserAttributes {}

export interface UserInstance
  extends Model<UserAttributes, UserCreationAttributes> {}

export const defineUserModel = (db: Sequelize) => {
  const User = db.define<UserInstance>(
    "User",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fake: {
        type: DataTypes.BOOLEAN,        
      },
    },
    {
      indexes: [
        {
          fields: ["id"],
        },
      ],
    }
  );

  return User;
};
