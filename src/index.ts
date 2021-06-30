import { Bot, BotEvents } from "./Bot";
import { TimeCycle, TimeCycleEvents } from "./TimeCycle";
import { Logic } from "./Logic";
import { SqliteUserStorage } from "./storage/SqliteUserStorage";
import { SqliteMessageStorage } from "./storage/SqliteMessageStorage";
import { SqliteBirthdayStorage } from "./storage/SqliteBirthdayStorage";
import { SqliteStorageFacade } from "./storage/SqliteStorageFacade";
import { logger } from "./util/logger";


const start = async () => {
  const token = process.env.BOT_TOKEN;
  
  if (token == undefined) throw new Error("No bot token provided");

  const bot = new Bot(token);
  await bot.start();

  const userStorage = new SqliteUserStorage();
  const messageStorage = new SqliteMessageStorage();
  const bdStorage = new SqliteBirthdayStorage();
  const storage = new SqliteStorageFacade(userStorage, messageStorage, bdStorage);  
  await storage.prepare();

  const cycle = new TimeCycle();

  const logic = new Logic(bot, cycle, storage);  

  await logic.start();

  logger.info("Started succesfully");

};


process.on("uncaughtException", (error) => {
  logger.error(error);
});

process.on("unhandledRejection", (error) => {
  logger.error(error);
})

start();
