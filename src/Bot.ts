import { Telegraf, Context, NarrowedContext } from "telegraf";
import EventEmitter from "events";
import { applyTz } from "./util/tzmoment";
import moment from "moment-timezone";

export const BotEvents = {
  MESSAGE: "message",
  SEND_STATS_REQUEST: "sendstats",
  BIRTHDAY_SET_REQUEST: "birthdayset",
};

export type MessageEventData = {
  first_name: string;
  last_name: string;
  username: string;
  userId: number;
  chatId: number;
  receiveDate: Date;
};

export type SendStatsRequestEventData = {
  chatId: number;
  date?: moment.Moment;
};

export type BirthdaySetRequestEventData = {
  userId: number;
  username: string;
  first_name: string;
  last_name: string;
  chatId: number;
  date: Date;
};

export declare interface Bot {
  on(event: "message", listener: (data: MessageEventData) => void): this;
  on(event: "sendstats", listener: (data: MessageEventData) => void): this;
  on(
    event: "birthdayset",
    listener: (data: BirthdaySetRequestEventData) => void
  ): this;
}

export class Bot extends EventEmitter {
  bot?: Telegraf;
  ready: boolean = false;

  constructor(private token: string) {
    super();
  }

  public async start() {
    if (this.ready) {
      return;
    }
    
    this.bot = new Telegraf(this.token);
    const botInfo = await this.bot.telegram.getMe();
    (this.bot as any).options.username = botInfo.username;
    this.bot.command("stats", this.onStatsCommand.bind(this));
    this.bot.command("birthday", this.onBirthdayCommand.bind(this));
    this.bot.on("message", this.onMessage.bind(this));

    process.once("SIGINT", () => this.bot?.stop("SIGINT"));
    process.once("SIGTERM", () => this.bot?.stop("SIGTERM"));

    await this.bot.launch();
    this.ready = true;
  }

  public sendMessage(chatId: number, text: string) {
    if (!this.ready) throw new Error("Not launched");
    return this.bot?.telegram.sendMessage(chatId, text);
  }

  onMessage(ctx: Context) {
    const chatId = ctx.chat?.id;

    if (ctx.message?.from.is_bot) {
      return;
    }

    if (chatId === undefined) return;

    if (chatId > 0) {
      return ctx.reply(
        "Добавляй меня в свою конфу, и каждый день я буду присылать туда статистику сообщений за сутки.\nСвязаться с автором можно по почте: kaizzzer@gmail.com"
      );
    }

    if (!ctx.message?.from) {
      return;
    }

    const { first_name, id: userId, last_name, username } = ctx.message.from;
    const receiveDate = moment(new Date(ctx.message.date * 1000)).toDate(); // UTC+0

    this.emit(BotEvents.MESSAGE, {
      first_name,
      last_name,
      userId,
      chatId,
      username,
      receiveDate,
    });
  }

  onStatsCommand(ctx: Context) {
    const chatId = ctx.chat?.id;
    const date = this.extractDate((ctx.message as any).text);

    if (typeof chatId === "number" && chatId < 0) {
      this.emit(BotEvents.SEND_STATS_REQUEST, {
        chatId,
        date: typeof date === "string" ? undefined : date,
      });
    }
  }

  async onBirthdayCommand(ctx: Context) {
    const text = (ctx.message as any).text;

    if (!text || typeof text !== "string") return;

    const date = this.extractDate(text);

    if (date == "NoDateInText") {
      await ctx.reply("День рождения задается в формате DD/MM/YYYY, дружок");
      return;
    }

    if (date == "NotAValidDate") {
      await ctx.reply("Такого не может быть, другалёк");
      return;
    }

    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;

    if (!userId || !chatId) {
      console.warn("WTF BRO");
      return;
    }

    this.emit(BotEvents.BIRTHDAY_SET_REQUEST, {
      date: date.toDate(),
      userId,
      chatId,
      username: ctx.from?.username,
      first_name: ctx.from?.first_name,
      last_name: ctx.from?.last_name,
    });
  }

  extractDate(text: string): "NoDateInText" | "NotAValidDate" | moment.Moment {
    const result = text.match(/(\d{2})\/(\d{2})\/(\d{4})/gi);

    if (!result) {
      return "NoDateInText";
    }

    const date = moment(result[0], "DD/MM/YYYY");

    if (!date.isValid()) return "NotAValidDate";

    return date;
  }
}
