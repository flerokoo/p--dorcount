import { IUserStorage } from "../contracts/IUserStorage";
import { IMessageStorage } from "../contracts/IMessageStorage";
import { IBirthdayStorage } from "../contracts/IBirthdayStorage";
import { IStorage } from "../contracts/IStorage";

export class SqliteStorageFacade implements IStorage {
  constructor(
    private user: IUserStorage,
    private message: IMessageStorage,
    private bd: IBirthdayStorage
  ) {}

  async prepare(): Promise<void> {
    await this.user.prepare();
    await this.message.prepare();
    await this.bd.prepare();
  }

  createUserIfNotExists(
    id: number,
    username: string,
    first_name: string,
    last_name: string,
    fake: boolean = false
  ): Promise<boolean> {
    return this.user.createUserIfNotExists(id, username, first_name, last_name, fake);
  }

  getUser(userId: number): Promise<import("../domain/User").User> {
    return this.user.getUser(userId);
  }

  saveMessage(
    chatId: number,
    userId: number,
    receiveDate: Date
  ): Promise<void> {
    return this.message.saveMessage(chatId, userId, receiveDate);
  }

  getMessagesBetweenDates(
    start: Date,
    end: Date
  ): Promise<import("../domain/Message").Message[]> {
    return this.message.getMessagesBetweenDates(start, end);
  }

  getAverageMessagesAtDay(
    chatId: number,
    day: number,
    excludeDate?: Date | undefined
  ): Promise<number> {
    return this.message.getAverageMessagesAtDay(chatId, day, excludeDate);
  }

  getBirthdaysAtDate(
    date: Date
  ): Promise<import("../domain/Birthday").Birthday[]> {
    return this.bd.getBirthdaysAtDate(date);
  }

  setBirthday(userId: number, chatId: number, date: Date): Promise<void> {
    return this.setBirthday(userId, chatId, date);
  }

  updateUser(userId: number, values: any): Promise<void> {
    return this.updateUser(userId, values);
  }
}
