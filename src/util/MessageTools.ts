import { Message } from "../domain/Message";
import { tzMoment } from "./tzmoment";
import { userSignature } from "./user-signature";
import { IStorage } from "../contracts/IStorage";

export class MessageTools {
  public static groupByChatId(messages: Message[]): Map<number, Message[]> {
    return messages.reduce((acc, m) => {
      if (!acc.has(m.chatId)) {
        acc.set(m.chatId, []);
      }
      acc.get(m.chatId)?.push(m);
      return acc;
    }, new Map<number, Message[]>());
  }

  public static groupByUser(messages: Message[]): Map<number, Message[]> {
    return messages.reduce((acc, msg) => {
      if (!acc.has(msg.userId)) {
        acc.set(msg.userId, []);
      }
      acc.get(msg.userId)!.push(msg);
      return acc;
    }, new Map<number, Message[]>());
  }

  public static async generateDayStatsText(
    groupedByUser: Map<number, Message[]>,
    storage: IStorage
  ) {
    const userDataPromises = [];
    for (const [userId, group] of groupedByUser.entries()) {
      userDataPromises.push(
        storage.getUser(userId).then((userData) => ({ userData, userId }))
      );
    }

    const userData = await Promise.all(userDataPromises);

    let texts = [];
    let totalMessages = 0;
    for (const userId of groupedByUser.keys()) {
      const group = groupedByUser.get(userId) as Message[];
      const count = group.length;
      const user = userData.find((d) => d.userId === userId)?.userData;

      totalMessages += count;

      if (!user) continue;
      const { first_name, last_name, username } = user;

      const userFinalName = userSignature(user);
      texts.push({ userFinalName, count });
    }

    return texts
      .sort((a, b) => b.count - a.count)
      .map(e => `${e.userFinalName}: ${e.count}`)
      .join("\n");
  }
}
