import db from "../database";
import { logError } from "../utils/errorHandler";

// Fonction pour récupérer les messages entre deux utilisateurs
export async function getMessagesBetweenUsers(user1: number) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM messages 
      WHERE (sender_id = ? OR receiver_id = ?) 
      ORDER BY sent_at ASC
    `;

    db.all(query, [user1, user1], (err, rows) => {
      if (err) {
        logError(err, "getMessagesBetweenUsers");
        return reject(err);
      }
      resolve(rows);
    });
  });
}

export async function getConversationId(user1: number, user2: number): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id FROM conversations 
      WHERE (user1_id = ? AND user2_id = ?) 
         OR (user1_id = ? AND user2_id = ?)
    `;
    db.get(query, [user1, user2, user2, user1], (err, row: { id: number } | undefined) => {
      if (err) {
        logError(err, "getConversationId");
        return reject(err);
      }
      // Gestion de la valeur de row qui peut être undefined
      resolve(row ? row.id : null);
    });
  });
}



export async function createConversation(user1: number, user2: number) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO conversations (user1_id, user2_id) 
      VALUES (?, ?)`;

    db.run(query, [user1, user2], function (err) {
      if (err) {
        logError(err, "createConversation");
        return reject(err);
      }
      resolve(this.lastID);
    });
  });
}

// Fonction pour enregistrer un message dans la base de données
export async function saveMessage(
  conversation_id: number,
  sender_id: number,
  receiver_id: number,
  content: string,
  sent_at: string
) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO messages (conversation_id, sender_id, receiver_id, content, sent_at)
      VALUES (?, ?, ?, ?, ?)`;

    db.run(query, [conversation_id, sender_id, receiver_id, content, sent_at], function (err) {
      if (err) {
        logError(err, "saveMessage");
        return reject(err);
      }
      resolve({ id: this.lastID, conversation_id, sender_id, receiver_id, content, sent_at });
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
