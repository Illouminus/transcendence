import db from "../database";
import { logError } from "../utils/errorHandler";

// Fonction pour récupérer les messages entre deux utilisateurs
export async function getMessagesBetweenUsers(user1: number, user2: number) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) 
      OR (sender_id = ? AND receiver_id = ?)
      ORDER BY timestamp ASC
    `;
    
    db.all(query, [user1, user2, user2, user1], (err, rows) => {
      if (err) {
        logError(err, "getMessagesBetweenUsers");
        return reject(err);
      }
      resolve(rows);
    });
  });
}

// Fonction pour enregistrer un message dans la base de données
export async function saveMessage(senderId: number, receiverId: number, content: string) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO messages (sender_id, receiver_id, content, timestamp) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;

    db.run(query, [senderId, receiverId, content], function (err) {
      if (err) {
        logError(err, "saveMessage");
        return reject(err);
      }
      resolve({ id: this.lastID, senderId, receiverId, content, timestamp: new Date() });
    });
  });
}

// Fonction pour récupérer toutes les conversations d'un utilisateur
export async function getUserConversations(userId: number) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT u.id, u.username, u.avatar_url
      FROM users u
      JOIN messages m ON u.id = m.sender_id OR u.id = m.receiver_id
      WHERE u.id != ?
    `;

    db.all(query, [userId], (err, rows) => {
      if (err) {
        logError(err, "getUserConversations");
        return reject(err);
      }
      resolve(rows);
    });
  });
}

// Fonction pour supprimer un message par son ID
export async function removeMessageById(messageId: number) {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM messages WHERE id = ?`;

    db.run(query, [messageId], function (err) {
      if (err) {
        logError(err, "removeMessageById");
        return reject(err);
      }
      resolve({ message: "Message deleted successfully" });
    });
  });
}
