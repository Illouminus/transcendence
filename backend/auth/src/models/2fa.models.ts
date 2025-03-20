import db from "../database";
import { GoogleUser, User} from "../@types/auth.types";
import { createDatabaseError } from "../utils/errorHandler";


export async function enableTwoFactorAuth(userId: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    db.run(
      "UPDATE users SET two_factor_enabled = 1 WHERE id = ?",
      [userId],
      function (err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}


export async function disableTwoFactorAuth(userId: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    db.run(
      "UPDATE users SET two_factor_enabled = 0 WHERE id = ?",
      [userId],
      function (err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}