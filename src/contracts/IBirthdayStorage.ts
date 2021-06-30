import { Birthday } from "../domain/Birthday";
export interface IBirthdayStorage {
  prepare(): Promise<void>;
  getBirthdaysAtDate(date: Date): Promise<Birthday[]>;
  setBirthday(userId: number, chatId: number, date: Date): Promise<void>;
}
