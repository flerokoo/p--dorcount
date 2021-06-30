import { Sequelize, ModelCtor } from "sequelize";
import { defineModels } from "../models/define-models";
import { User } from "../domain/User";
import { UserInstance } from "../models/User";
import { BirthdayInstance } from "../models/Birthday";
import { MessageInstance } from "../models/Message";
import { isProduction } from "../util/is-production";



let sequelize: Sequelize;
let User: ModelCtor<UserInstance>;
let Birthday: ModelCtor<BirthdayInstance>;
let Message: ModelCtor<MessageInstance>;


export async function createSequelize() {

  if (!sequelize) {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: "./persist/database.sqlite",
      logging: !isProduction()
    });

    const models = defineModels(sequelize);

    User = models.User;
    Birthday = models.Birthday;
    Message = models.Message;
    
    await sequelize.sync();
  }

  return {
    sequelize,
    User,
    Birthday,
    Message
  };
}
