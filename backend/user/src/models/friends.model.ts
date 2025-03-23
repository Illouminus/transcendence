import { FriendsList } from "../@types/friends.types";
import db from "../database";

export async function getFriendsListFromDB(userId: number): Promise<FriendsList[]> {
    return new Promise((resolve, reject) => {
      // Используем db.all, так как ожидаем несколько строк (список друзей)
      const query = `
       SELECT 
        CASE
          WHEN f.user_profile_id = ? THEN u2.id
          ELSE u1.id
        END AS friend_id,
        CASE
          WHEN f.user_profile_id = ? THEN u2.username
          ELSE u1.username
        END AS friend_username,
        CASE
          WHEN f.user_profile_id = ? THEN u2.avatar_url
          ELSE u1.avatar_url
        END AS friend_avatar,
        f.status
      FROM friends f
      JOIN user_profile u1 ON u1.id = f.user_profile_id
      JOIN user_profile u2 ON u2.id = f.friend_profile_id
      WHERE ? IN (f.user_profile_id, f.friend_profile_id)
      `;
      db.all(query, [userId, userId, userId, userId], (err: Error | null, rows: FriendsList[]) => {
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


  export async function getOutgoingRequestsDb(userId: number): Promise<FriendsList[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.id, u.username, u.avatar_url AS avatar, f.status
        FROM friends f
        JOIN user_profile u ON f.friend_profile_id = u.id
        WHERE f.user_profile_id = ? AND f.status = 'pending'
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


  export async function acceptFriendRequestDB(userId: number, friendId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE friends
        SET status = 'accepted'
        WHERE user_profile_id = ? AND friend_profile_id = ?
      `;
      db.run(query, [friendId, userId], function (err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve('Friend request accepted successfully');
        }
      });
    });
  }



  export async function rejectFriendRequestDB(userId: number, friendId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const query = `
        DELETE FROM friends
        WHERE user_profile_id = ? AND friend_profile_id = ?
      `;
      db.run(query, [friendId, userId], function (err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve('Friend request rejected successfully');
        }
      });
    });
  }


  export async function blockFriendDB(userId: number, friendId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE friends
        SET status = 'blocked'
        WHERE user_profile_id = ? AND friend_profile_id = ? OR user_profile_id = ? AND friend_profile_id = ?
      `;
      db.run(query, [userId, friendId, friendId, userId], function (err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve('Friend blocked successfully');
        }
      });
    });
  }


  export async function unblockFriendDb(userId: number, friendId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE friends
        SET status = 'accepted'
        WHERE user_profile_id = ? AND friend_profile_id = ? OR user_profile_id = ? AND friend_profile_id = ?
      `;
      db.run(query, [userId, friendId, friendId, userId], function (err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve('Friend unblocked successfully');
        }
      });
    });
  }

  export async function deleteFriendDb(userId: number, friendId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const query = `
        DELETE FROM friends
        WHERE (user_profile_id = ? AND friend_profile_id = ?) OR (user_profile_id = ? AND friend_profile_id = ?)
      `;
      db.run(query, [userId, friendId, friendId, userId], function (err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve('Friend deleted successfully');
        }
      });
    });
  }


export async function getFriendshipRecord(userId: number, friendId: number): Promise<{ status: string } | null> {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT status 
      FROM friends 
      WHERE user_profile_id = ? AND friend_profile_id = ?
    `;
    db.get(query, [userId, friendId], (err: Error | null, row: { status: string } | undefined) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}