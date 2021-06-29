import { Bot, BotEvents } from "./Bot";
import { TimeCycle, TimeCycleEvents } from "./TimeCycle";
import { SqliteStorage } from "./storage/SqliteStorage";
import { Logic } from "./Logic";
import { tzMoment } from "./util/tzmoment";
import moment from "moment-timezone";


const start = async () => {
  const token = process.env.BOT_TOKEN;
  
  if (token == undefined) throw new Error("No bot token provided");

  const bot = new Bot(token);

  const storage = new SqliteStorage();

  const cycle = new TimeCycle();

  const logic = new Logic(bot, cycle, storage);  

  await logic.start();

};

start();
