import { FriendsList } from "../@types/friends.types";
import db from "../database";

export async function getFriendsListFromDB(userId: number): Promise<FriendsList[]> {
    return new Promise((resolve, reject) => {
      // Используем db.all, так как ожидаем несколько строк (список друзей)
      const query = `
        SELECT u.id, u.username, u.avatar_url AS avatar, f.status
        FROM friends f
        JOIN user_profile u ON f.friend_profile_id = u.id
        WHERE f.user_profile_id = ?
      `;
      db.all(query, [userId], (err: Error | null, rows: FriendsList[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }