import { IStorage } from "../contracts/IStorage";
import { User } from "../domain/User";
import { Message } from "../domain/Message";
import { Sequelize, ModelCtor, Op } from "sequelize";
import { defineMessageModel, MessageInstance } from "../models/Message";
import { defineUserModel, UserInstance } from "../models/User";
import { defineModels } from "../models/define-models";
import moment from "moment-timezone";
import { BirthdayInstance } from "../models/Birthday";
import { Birthday } from "../domain/Birthday";
import { tzMoment, applyTz } from "../util/tzmoment";

let UserModel: ModelCtor<UserInstance>;
let MessageModel: ModelCtor<MessageInstance>;
let BirthdayModel: ModelCtor<BirthdayInstance>;

export class SqliteStorage implements IStorage {
  ready: boolean = false;
  sequelize?: Sequelize;

  async prepare() {
    if (this.ready) return;
    this.sequelize = new Sequelize({
      dialect: "sqlite",
      storage: "./persist/database.sqlite",
    });

    const models = defineModels(this.sequelize);
    UserModel = models.User;
    MessageModel = models.Message;
    BirthdayModel = models.Birthday;

    await this.sequelize.sync();

    this.ready = true;
  }

  public async saveMessage(chatId: number, userId: number, createdAt: Date) {
    this.assertReady();
    var dayOfWeek = createdAt.getDay();
    MessageModel.create({ chatId, userId, createdAt, dayOfWeek }).catch(
      (err) => {
        console.log(err);
      }
    );
  }

  public async getAverageMessagesAtDay(
    chatId: number,
    dayOfWeek: number,
    beforeDate?: Date
  ): Promise<number> {
    this.assertReady();

    let exclusion = {};

    if (beforeDate) {
      const m = applyTz(moment(beforeDate));
      exclusion = {
        createdAt: {
          [Op.lte]: m.startOf("day").toDate(),
        },
      };
    }

    console.log(exclusion);

    const messages = await MessageModel.findAll({
      where: {
        chatId,
        dayOfWeek,
        ...exclusion,
      },
    });

    if (!messages.length || messages.length === 0) return Promise.resolve(0);

    const formatDate = (date: Date) =>
      [date.getDate(), date.getMonth(), date.getFullYear()].join("-");

    const uniqueDays = new Set(
      messages.map((msg) => formatDate(msg.getDataValue("createdAt") as Date))
    ).size;

    if (uniqueDays == 0) return Promise.resolve(0);

    return messages.length / uniqueDays;
  }

  public async createUserIfNotExists(
    id: number,
    username: string,
    first_name: string,
    last_name: string
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
        fake: false,
      });
      return true;
    } else {
      if (user.getDataValue("fake")) {
        const getSignature = (
          username: string,
          first_name: string,
          last_name: string
        ) =>
          (username ?? (first_name || "") + " " + (last_name + ""))
            .trim()
            .toLowerCase();

        const current = getSignature(
          user.getDataValue("username"),
          user.getDataValue("first_name"),
          user.getDataValue("last_name")
        );

        const incoming = getSignature(username, first_name, last_name);

        if (current !== incoming) {
          // looks like user with this id is not the same as fake user
          // move fake user to new id
          const newId = await this.generateFakeUserId();
          await UserModel.create({
            fake: true,
            username: user.getDataValue("username"),
            last_name: user.getDataValue("last_name"),
            first_name: user.getDataValue("first_name"),
            id: newId,
          });

          await MessageModel.update(
            { userId: newId },
            { where: { userId: id } }
          );

          // set real values
          user.setDataValue("fake", false);
          user.setDataValue("username", username);
          user.setDataValue("first_name", first_name);
          user.setDataValue("last_name", last_name);
          await user.save();
        } else {
          // looks like user with this id is same as fake user
          // just fill all missing fields
          user.setDataValue("fake", false);
          user.setDataValue("username", username);
          user.setDataValue("first_name", first_name);
          user.setDataValue("last_name", last_name);
          await user.save();
        }
      }
    }
    return false;
  }

  async getUser(userId: number): Promise<User> {
    const user = await UserModel.findByPk(userId);
    if (user == null) return Promise.reject();

    return {
      first_name: user.getDataValue("first_name"),
      last_name: user.getDataValue("last_name"),
      username: user.getDataValue("username"),
      id: user.getDataValue("id"),
    };
  }

  async getMessagesBetweenDates(
    startDate: Date,
    endDate: Date
  ): Promise<Message[]> {
    const messages = await MessageModel.findAll({
      where: {
        createdAt: {
          [Op.and]: {
            [Op.gte]: startDate,
            [Op.lte]: endDate,
          },
        },
      },
    });

    if (messages == null) return Promise.resolve([]);

    return messages.map((msg) => ({
      chatId: msg.getDataValue("chatId"),
      userId: msg.getDataValue("userId"),
      dayOfWeek: msg.getDataValue("dayOfWeek"),
    }));
  }

  assertReady() {
    if (!this.ready) throw new Error("SqliteStorage not ready");
  }

  async getBirthdaysAtDate(date: Date): Promise<Birthday[]> {
    const d = applyTz(moment(date));
    const dayOfYear = d.dayOfYear();
    const bds = await BirthdayModel.findAll({
      where: {
        dayOfYear,
      },
    });

    return bds.map((b) => ({
      date: b.getDataValue("date"),
      userId: b.getDataValue("userId"),
      definedInChatId: b.getDataValue("definedInChatId"),
      dayOfYear: b.getDataValue("dayOfYear"),
    }));
  }

  async setBirthday(userId: number, chatId: number, date: Date): Promise<void> {
    const dayOfYear = applyTz(moment(date)).dayOfYear();
    const bd = await BirthdayModel.findOne({
      where: { userId, definedInChatId: chatId },
      rejectOnEmpty: false,
    });

    if (bd) {
      bd.setDataValue("date", date);
      bd.setDataValue("dayOfYear", dayOfYear);
      await bd.save();
    } else {
      await BirthdayModel.create({
        userId,
        date,
        dayOfYear,
        definedInChatId: chatId,
      });
    }
  }

  async generateFakeUserId() {
    let newId: number;
    while (true) {
      newId = Math.round(Math.random() * 1e32);
      const user = await UserModel.findOne({ where: { id: newId } });
      if (!user) return newId;
    }
  }
}
