import db from "../database";
import { GoogleUser, User} from "../@types/auth.types";
import { createDatabaseError } from "../utils/errorHandler";
import { get } from "http";


export async function getUserByEmail(email: string): Promise<User | null> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT * FROM users WHERE email = ?",
			[email],
			(err: Error | null, user: User | undefined) => {
				if (err) reject(err);
				else resolve(user || null);
			}
		);
	});
}


export async function updateUserData(
	userId: number,
	data: {
	  username: string;
	  email: string;
	  password_hash?: string | null;
	}
  ): Promise<User | null> {
	const updateFields: string[] = [];
	const params: any[] = [];
  
	Object.entries(data).forEach(([key, value]) => {
	  if (value !== undefined) {
		updateFields.push(`${key} = ?`);
		params.push(value);
	  }
	});
  
	updateFields.push("updated_at = datetime('now')");
	
	params.push(userId);
  
	const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
  
	return new Promise((resolve, reject) => {
	  db.run(query, params, function (err: Error | null) {
		if (err) {
		  reject(err);
		} else {
		  const user = getUserById(userId);
		  resolve(user);
		}
	  });
	});
  }
  

export async function getUserByGoogleId(token: string): Promise<User | null> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT * FROM users WHERE google_id = ?",
			[token],
			(err: Error | null, user: User | undefined) => {
				if (err) reject(err);
				else resolve(user || null);
			}
		);
	});
}


export async function getUserById(id: number): Promise<User | null> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT * FROM users WHERE id = ?",
			[id],
			(err: Error | null, user: User | undefined) => {
				if (err) reject(err);
				else resolve(user || null);
			}
		);
	});
}

export async function dbCreateUser(
	username: string,
	email: string,
	password_hash: string
  ): Promise<User | null>  {
	return new Promise((resolve, reject) => {
	  db.run(
		"INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
		[username, email, password_hash],
		function (this: { lastID: number }, err: Error | null) {
		  if (err) {
			reject(err);
		  } else {
			const userId = this.lastID;
			const user = getUserById(userId);
			if (!user) {
			  reject(createDatabaseError("User creation failed"));
			} else {
			  resolve(user);
		  }
		}
	  }
	);
	});
  }

export async function createGooleUser(user: GoogleUser): Promise<number> {
	return new Promise((resolve, reject) => {
		db.run(
			"INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)",
			[user.name, user.email, user.sub],
			function (this: { lastID: number }, err: Error | null) {
				if (err) reject(err);
				else resolve(this.lastID);
			}
		);
	});
}

export async function deleteSession(userId: number): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		db.run(
			"DELETE FROM sessions WHERE user_id = ?",
			[userId],
			function (err: Error | null) {
				if (err) return reject(err);
				resolve();
			}
		);
	});
}
