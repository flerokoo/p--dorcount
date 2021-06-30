import { User } from "../domain/User";
export interface IUserStorage {
  prepare(): Promise<void>;
  createUserIfNotExists(id: number, username: string, first_name: string, last_name: string, fake: boolean = false): Promise<boolean>;
  getUser(userId: number): Promise<User>;
  updateUser(userId: number, values : any) : Promise<void>;
}


