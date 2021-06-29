export type NewMonthEventData = {
  isNewYear: boolean;
}

export type NewDayEventData = {
  isNewMonth: boolean,
  isNewYear: boolean,
}

export interface ITimeCycle {
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  on(event: 'newday', listener: (data: NewDayEventData) => void): this;  
  on(event: 'newmonth', listener: (data: NewMonthEventData) => void): this;  
  on(event: 'newyear', listener: () => void): this;  
}
