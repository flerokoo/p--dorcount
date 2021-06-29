import { User } from "../domain/User";

export const userSignature = (user: User, withSobaka = true) => {
  if (user.username) {
    return (withSobaka ? "@" : "") + user.username;
  } else {
    return ((user.first_name || "") + " " + (user.last_name || "")).trim();
  }
}