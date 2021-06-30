import {
  Bot,
  MessageEventData,
  SendStatsRequestEventData,
  BirthdaySetRequestEventData,
} from "./Bot";
import { ITimeCycle } from "./contracts/ITimeCycle";
import { Message } from "./domain/Message";
import { MessageTools } from "./util/MessageTools";
import { tzMoment } from "./util/tzmoment";
import { Birthday } from "./domain/Birthday";
import { userSignature } from "./util/user-signature";
import plural from "plural-ru";
import { IStorage } from "./contracts/IStorage";
import { logger } from "./util/logger";

const dayTexts = [
  "среднего воскресенья",
  "среднего понедельника",
  "среднего вторника",
  "средней среды",
  "среднего четверга",
  "средней пятницы",
  "средней субботы",
];

export class Logic {
  constructor(
    private bot: Bot,
    private cycle: ITimeCycle,
    private storage: IStorage
  ) {}

  async start() {
    
    const catchAndLog = (callback: Function) => (...data: any) => {
      try {
        callback(...data);
      } catch (error) {
        logger.error(error);
      }
    };

    this.cycle.on("newday", catchAndLog(this.onNewDay.bind(this)));
    this.bot.on("message", catchAndLog(this.onBotNewMessage.bind(this)));
    this.bot.on("sendstats", catchAndLog(this.onSendStatsRequest.bind(this)));
    this.bot.on("birthdayset", catchAndLog(this.onBirthdaySetRequest.bind(this)));

    this.cycle.start();
  }

  async onNewDay() {
    await this.sendDayStats();
    await this.sendBirthdays();
  }

  private async sendDayStats() {
    const currentDate = tzMoment().subtract(1, "hour");
    const currentDay = currentDate.toDate().getDay();

    const all = await this.storage.getMessagesBetweenDates(
      currentDate.startOf("day").toDate(),
      currentDate.endOf("day").toDate()
    );
    const groupedByChat = MessageTools.groupByChatId(all);

    for (const chatId of groupedByChat.keys()) {
      const messagesToday = groupedByChat.get(chatId) as Message[];
      const messageCountToday = messagesToday!.length;

      let averageMessages = await this.storage.getAverageMessagesAtDay(
        chatId,
        currentDay,
        currentDate.toDate()
      );
      if (averageMessages == 0) averageMessages = messageCountToday;
      
      const groupedByUser = MessageTools.groupByUser(messagesToday);
      const statsText = await MessageTools.generateDayStatsText(
        groupedByUser,
        this.storage
      );

      const messageWord = plural(
        messageCountToday,
        "сообщение",
        "сообщения",
        "сообщений"
      );

      const dayText = dayTexts[currentDate.day()];
      const percent = Math.round((messageCountToday / averageMessages) * 100);
      const text = `За сегодня уважаемые участники этого чата написали ${messageCountToday} ${messageWord} и наговорили на ${percent}% от ${dayText}\n${statsText}`;

      this.bot.sendMessage(chatId, text);
    }
  }

  async sendBirthdays() {
    const bds = await this.storage.getBirthdaysAtDate(tzMoment().toDate());

    const groupedByChat = bds.reduce((acc, cur) => {
      if (!acc.has(cur.definedInChatId)) acc.set(cur.definedInChatId, []);
      acc.get(cur.definedInChatId)!.push(cur);
      return acc;
    }, new Map<number, Birthday[]>());

    for (const [chatId, chatBds] of groupedByChat.entries()) {
      if (chatBds.length === 0) continue;

      let usernames = [];

      for (const bd of chatBds) {
        const user = await this.storage.getUser(bd.userId);
        const sig = userSignature(user);
        usernames.push(sig);
      }

      const texts = [
        "Сегодня день рождения",
        chatBds.length > 1 ? "празднуют" : "празднует",
        usernames.join(","),
      ].join(" ");

      await this.bot.sendMessage(chatId, texts);
    }
  }

  async onBotNewMessage({
    userId,
    username,
    first_name,
    last_name,
    chatId,
    receiveDate,
  }: MessageEventData) {
    await this.replaceFakeUserOrCreateNew(
      userId,
      username,
      first_name,
      last_name
    );
    await this.storage.saveMessage(chatId, userId, receiveDate);
  }

  async onSendStatsRequest(data: SendStatsRequestEventData) {
    // const all = await this.storage.getMessagesBetweenDates(
    //   tzMoment().startOf("day").toDate(),
    //   tzMoment().endOf("day").toDate()
    // );
    // const groupedByChat = MessageTools.groupByChatId(all);
    // this.bot.sendMessage(data.chatId, all.length.toString());
    console.log("STATS");
    await this.sendDayStats();
    await this.sendBirthdays();
  }

  async onBirthdaySetRequest(data: BirthdaySetRequestEventData) {
    await this.replaceFakeUserOrCreateNew(
      data.userId,
      data.username,
      data.first_name,
      data.last_name
    );
    await this.storage.setBirthday(data.userId, data.chatId, data.date);
    await this.bot.sendMessage(data.chatId, "День рождения задан, дружбан");
  }

  async replaceFakeUserOrCreateNew(
    id: number,
    username: string,
    first_name: string,
    last_name: string
  ) {
    const user = await this.storage.getUser(id);

    if (!user) {
      await this.storage.createUserIfNotExists(
        id,
        username,
        first_name,
        last_name
      );
      return;
    }

    if (user.fake) {
      // replace fake values with real ones
      await this.storage.updateUser(id, {
        username,
        first_name,
        last_name,
      });
    }
  }

  async generateFakeUserId() {
    let newId: number;
    while (true) {
      newId = Math.round(Math.random() * 1e32);
      const user = await this.storage.getUser(newId);
      if (!user) return newId;
    }
  }
}
