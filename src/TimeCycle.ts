import EventEmitter from "events";
import { ITimeCycle } from "./contracts/ITimeCycle";
import moment from "moment-timezone";



export const TimeCycleEvents = {
  "NEW_DAY": "newday",
  "NEW_YEAR": "newyear",
  "NEW_MONTH": "newmonth"
};

export class TimeCycle extends EventEmitter implements ITimeCycle {
  static EVENTS: Object;
  intervalId?: NodeJS.Timeout;
  lastDay: number = 0;
  lastYear: number = 0;
  lastMonth: number = 0;

  constructor() {
    super();    
  }
  isRunning(): boolean {
    return !!this.intervalId;
  }

  public start() {
    this.intervalId = setInterval(
      this.onInterval.bind(this),
      5 * 1000 //every 5 seconds, todo: parametrize
    );
    this.lastDay = this.day;
    this.lastYear = this.year;
    this.lastMonth = this.month;
    return Promise.resolve();
  }

  public stop() {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
    }
    this.intervalId = undefined;
    return Promise.resolve();
  }

  public onInterval() {

    const year = this.year;
    const isNewYear = this.lastYear !== year;
    if (isNewYear) {
      this.emit(TimeCycleEvents.NEW_YEAR);
      this.lastYear = year;
    }

    const month = this.month;
    const isNewMonth = this.lastMonth !== month;
    if (isNewMonth) {
      this.emit(TimeCycleEvents.NEW_MONTH, {isNewYear});
      this.lastMonth = month;
    }

    const day = this.day;
    if (this.lastDay !== day) {
      this.emit(TimeCycleEvents.NEW_DAY, {isNewMonth, isNewYear});
      this.lastDay = day;
    }
  }

  get day() {
    let now = moment();
    return (now as any).tz("Europe/Moscow").day();
  }

  get year() {
    return (moment() as any).tz("Europe/Moscow").year();
  }

  get month() {
    return (moment() as any).tz("Europe/Moscow").month();
  }

}
