import moment from "moment-timezone";



export function tzMoment() {
  var now = moment();    
  return applyTz(now);  
}

export function applyTz(moment: moment.Moment) {
  (moment as any).tz("Europe/Moscow");
  return moment;
}