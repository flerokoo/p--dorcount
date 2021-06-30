import { Message } from "../domain/Message";
import { Sequelize, Op, ModelCtor } from "sequelize";
import moment from "moment-timezone";
import { applyTz } from "../util/tzmoment";
import { createSequelize } from "./create-sequelize";
import { IMessageStorage } from "../contracts/IMessageStorage";
import { MessageInstance } from "../models/Message";

let MessageModel: ModelCtor<MessageInstance>;

export class SqliteMessageStorage implements IMessageStorage {
  ready: boolean = false;
  sequelize?: Sequelize;

  async prepare() {
    if (this.ready) return;
    const created = await createSequelize();
    this.sequelize = created.sequelize;
    MessageModel = created.Message;
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

  async getMessagesBetweenDates(
    startDate: Date,
    endDate: Date
  ): Promise<Message[]> {
    this.assertReady();
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
}
