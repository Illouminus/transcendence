import db from "../database";
import { User } from "../@types/auth.types";

export async function getUserByEmail(email: string): Promise<User | null> {
	return new Promise((resolve, reject) => {
		db.get("SELECT * FROM users WHERE email = ?", [email], (err: string, user: User | undefined) => {
			if (err) reject(err);
			resolve(user || null);
		});
	});
}

export async function createUser(username: string, email: string, password_hash: string): Promise<number> {
	return new Promise((resolve, reject) => {
		db.run(
			"INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
			[username, email, password_hash],
			function (this: { lastID: number }, err: string) {
				if (err) reject(err);
				else resolve(this.lastID);
			}
		);
	});
}