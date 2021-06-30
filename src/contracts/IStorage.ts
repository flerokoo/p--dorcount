import { IUserStorage } from "./IUserStorage";
import { IMessageStorage } from "./IMessageStorage";
import { IBirthdayStorage } from "./IBirthdayStorage";

export interface IStorage
  extends IUserStorage,
    IMessageStorage,
    IBirthdayStorage {}
