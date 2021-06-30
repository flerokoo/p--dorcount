import { Sequelize, ModelCtor } from "sequelize";
import moment from "moment-timezone";
import { Birthday } from "../domain/Birthday";
import { applyTz } from "../util/tzmoment";
import { createSequelize } from "./create-sequelize";
import { IBirthdayStorage } from "../contracts/IBirthdayStorage";
import { BirthdayInstance } from "../models/Birthday";

let BirthdayModel: ModelCtor<BirthdayInstance>;

export class SqliteBirthdayStorage implements IBirthdayStorage {

  ready: boolean = false;
  sequelize?: Sequelize;

  async prepare() {
    if (this.ready) return;
    const created = await createSequelize();
    this.sequelize = created.sequelize;
    BirthdayModel = created.Birthday;
    await this.sequelize.sync();
    this.ready = true;
  }

  assertReady() {
    if (!this.ready) throw new Error("SqliteStorage not ready");
  }

  async getBirthdaysAtDate(date: Date): Promise<Birthday[]> {
    this.assertReady();
    const d = applyTz(moment(date));
    const dayOfMonth = d.date();
    const month = d.month();
    const bds = await BirthdayModel.findAll({
      where: {
        month,
        dayOfMonth,
      },
    });
    return bds.map((b) => ({
      date: b.getDataValue("date"),
      userId: b.getDataValue("userId"),
      definedInChatId: b.getDataValue("definedInChatId"),
      dayOfMonth: b.getDataValue("dayOfMonth"),
      month: b.getDataValue("month"),
    }));
  }

  async setBirthday(userId: number, chatId: number, date: Date): Promise<void> {
    this.assertReady();
    const dayOfMonth = applyTz(moment(date)).date();
    const month = applyTz(moment(date)).month();
    const bd = await BirthdayModel.findOne({
      where: { userId, definedInChatId: chatId },
      rejectOnEmpty: false,
    });
    if (bd) {
      bd.setDataValue("date", date);
      bd.setDataValue("dayOfMonth", dayOfMonth);
      bd.setDataValue("month", month);
      await bd.save();
    } else {
      await BirthdayModel.create({
        userId,
        date,
        dayOfMonth,
        month,
        definedInChatId: chatId,
      });
    }
  }

}
