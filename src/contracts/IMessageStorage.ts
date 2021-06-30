import { Message } from "../domain/Message";
export interface IMessageStorage {
  prepare(): Promise<void>;
  saveMessage(chatId: number, userId: number, receiveDate: Date): Promise<void>;
  getMessagesBetweenDates(start: Date, end: Date): Promise<Message[]>;
  getAverageMessagesAtDay(chatId: number, day: number, excludeDate?: Date): Promise<number>;
}
