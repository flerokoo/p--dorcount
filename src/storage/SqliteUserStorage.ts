import { User } from "../domain/User";
import { Sequelize, ModelCtor } from "sequelize";
import { IUserStorage } from "../contracts/IUserStorage";
import { createSequelize } from "./create-sequelize";
import { UserInstance } from "../models/User";

let UserModel: ModelCtor<UserInstance>;

export class SqliteUserStorage implements IUserStorage {
  ready: boolean = false;
  sequelize?: Sequelize;

  assertReady() {
    if (!this.ready) throw new Error("SqliteStorage not ready");
  }

  async prepare() {
    if (this.ready) return;
    const created = await createSequelize();
    this.sequelize = created.sequelize;
    UserModel = created.User;
    await this.sequelize.sync();
    this.ready = true;
  }

  public async createUserIfNotExists(
    id: number,
    username: string,
    first_name: string,
    last_name: string,
    fake: boolean = false
  ) {
    this.assertReady();

    username = username ?? "";
    first_name = first_name ?? "";
    last_name = last_name ?? "";

    const user = await UserModel.findOne({
      where: {
        id,
      },
      rejectOnEmpty: false,
    });

    if (!user) {
      await UserModel.create({
        username,
        first_name,
        last_name,
        id,
        fake,
      });
      return true;
    }

    return false;
  }

  async getUser(userId: number): Promise<User> {
    this.assertReady();
    const user = await UserModel.findByPk(userId);
    if (user == null) return Promise.reject();
    return {
      first_name: user.getDataValue("first_name"),
      last_name: user.getDataValue("last_name"),
      username: user.getDataValue("username"),
      id: user.getDataValue("id"),
      fake: user.getDataValue("fake"),
    };
  }

  async updateUser(userId: number, values: any): Promise<void> {
    this.assertReady();
    await UserModel.update(values, { where: { id: userId } });
  }
}
