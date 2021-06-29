import { Message } from "../domain/Message";
import { User } from "../domain/User";
import { Birthday } from "../domain/Birthday";

export interface IStorage {
  prepare(): Promise<void>;

  saveMessage(chatId: number, userId: number, receiveDate: Date): Promise<void>;

  createUserIfNotExists(
    id: number,
    username: string,
    first_name: string,
    last_name: string
  ): Promise<boolean>;

  getUser(userId: number): Promise<User>;

  getMessagesBetweenDates(start: Date, end: Date): Promise<Message[]>;

  getAverageMessagesAtDay(chatId: number, day: number, excludeDate?:Date): Promise<number>;
  
  getBirthdaysAtDate(date: Date): Promise<Birthday[]>;

  setBirthday(userId: number, chatId: number, date: Date): Promise<void>;
}

// when saving message: create user if not exists, create message

// when sending stats:
// gather messages for last 24 hours (getLastDayMessages)
// group by chat id
// for each chat group by user id
// for each user id retrieve user info (getUser)
