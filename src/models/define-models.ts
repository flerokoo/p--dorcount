import { Sequelize } from "sequelize";
import { defineMessageModel } from "./Message";
import { defineUserModel } from "./User";
import { defineBirthdayModel } from "./Birthday";

export const defineModels = (db: Sequelize) => {
  const Message = defineMessageModel(db);
  const User = defineUserModel(db);
  const Birthday = defineBirthdayModel(db);

  // Message.belongsTo(User, { foreignKey: "userId" });
  // User.hasMany(Message, { foreignKey: "userId" });

  return { Message, User, Birthday };
};
