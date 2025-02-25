import db from "../database";
import { GoogleUser, User, Achievement, CountRow } from "../@types/auth.types";


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
	  username?: string;
	  email?: string;
	  password_hash?: string | null;
	  avatar_url?: string | null;
	  is_verified?: boolean;
	  wins?: number;
	  losses?: number;
	}
  ): Promise<void> {
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
		  resolve();
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

export async function createUser(
	username: string,
	email: string,
	password_hash: string,
	avatar_url: string | null = null
): Promise<number> {
	return new Promise((resolve, reject) => {
		db.run(
			"INSERT INTO users (username, email, password_hash, avatar_url) VALUES (?, ?, ?, ?)",
			[username, email, password_hash, avatar_url],
			function (this: { lastID: number }, err: Error | null) {
				if (err) reject(err);
				else resolve(this.lastID);
			}
		);
	});
}

export async function createGooleUser(user: GoogleUser): Promise<number> {
	return new Promise((resolve, reject) => {
		db.run(
			"INSERT INTO users (username, email, avatar_url, google_id) VALUES (?, ?, ?, ?)",
			[user.name, user.email, user.picture, user.sub],
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

export async function getTotalGamesPlayed(userId: number): Promise<number> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT COUNT(*) AS totalGames FROM games WHERE player1_id = ? OR player2_id = ?",
			[userId, userId],
			(err: Error | null, row: unknown) => {
				if (err) {
					reject(err);
				} else {
					const countRow = row as CountRow;
					resolve(countRow.totalGames || 0);
				}
			}
		);
	});
}

export async function getTotalTournaments(userId: number): Promise<number> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT COUNT(*) AS totalTournaments FROM tournament_participants WHERE user_id = ?",
			[userId],
			(err: Error | null, row: unknown) => {
				if (err) {
					reject(err);
				} else {
					const countRow = row as CountRow;
					resolve(countRow.totalTournaments || 0);
				}
			}
		);
	});
}

export async function getTournamentWins(userId: number): Promise<number> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT COUNT(*) AS tournamentWins FROM tournament_participants WHERE user_id = ? AND score > 0",
			[userId],
			(err: Error | null, row: unknown) => {
				if (err) {
					reject(err);
				} else {
					const countRow = row as CountRow;
					resolve(countRow.tournamentWins || 0);
				}
			}
		);
	});
}

export async function getUserAchievements(userId: number): Promise<Achievement[]> {
	return new Promise((resolve, reject) => {
		db.all(
			"SELECT * FROM user_achievements WHERE user_id = ?",
			[userId],
			(err: Error | null, rows: unknown) => {
				if (err) {
					reject(err);
				} else {
					const achievements: Achievement[] = (rows as any[]).map((row) => ({
						id: row.id,
						userId: row.user_id,
						achievement: row.achievement,
						dateEarned: row.date_earned,
					}));
					resolve(achievements);
				}
			}
		);
	});
}