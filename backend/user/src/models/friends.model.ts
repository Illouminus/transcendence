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



  export async function sendFriendRequestDB(userId: number, friendId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO friends (user_profile_id, friend_profile_id, status)
        VALUES (?, ?, 'pending')
      `;
      db.run(query, [userId, friendId], function (err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve('Friend request sent successfully');
        }
      }
      );
    });
  }


  export async function getIncomingRequestsDb(userId: number): Promise<FriendsList[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.id, u.username, u.avatar_url AS avatar, f.status
        FROM friends f
        JOIN user_profile u ON f.user_profile_id = u.id
        WHERE f.friend_profile_id = ? AND f.status = 'pending'
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