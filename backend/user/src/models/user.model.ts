import db from "../database";
import { GoogleUser, User, Achievement, CountRow } from "../@types/user.types";



export async function updateAvatar(userId: number, avatar_url: string | null): Promise<void> {
	if (avatar_url) {
		return new Promise((resolve, reject) => {
			db.run(
				"UPDATE user_profile SET avatar_url = ? WHERE auth_user_id = ?",
				[avatar_url, userId],
				function (err: Error | null) {
					if (err) reject(err);
					else resolve();
				}
			);
		});
	}	
}

export async function updateUsername(userId: number, username: string, email: string): Promise<void> {
	return new Promise((resolve, reject) => {
		db.run(
			"UPDATE user_profile SET username = ? WHERE auth_user_id = ?",
			[username, userId],
			function (err: Error | null) {
				if (err) reject(err);
				else resolve();
			}
		);
	});
}


export async function updateUserData(
	userId: number,
	data: {
	  username?: string;
	  email?: string;
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
  
	const query = `UPDATE user_profile SET ${updateFields.join(", ")} WHERE auth_user_id = ?`;
  
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
  


export async function getUserById(id: number): Promise<User | null> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT * FROM user_profile WHERE id = ?",
			[id],
			(err: Error | null, user: User | undefined) => {
				if (err) reject(err);
				else resolve(user || null);
			}
		);
	});
}


export async function getUserByAuthId(authUserId: number): Promise<User | null> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT * FROM user_profile WHERE auth_user_id = ?",
			[authUserId],
			(err: Error | null, user: User | undefined) => {
				if (err) reject(err);
				else resolve(user || null);
			}
		);
	});
}

export async function createUser(
	userId: number,
	username: string,
	avatar_url: string,
	email: string
): Promise<User | null> {
	return new Promise((resolve, reject) => {
		db.run(
			"INSERT INTO user_profile (auth_user_id, username, avatar_url, email) VALUES (?, ?, ?, ?)",
			[userId, username, avatar_url, email],
			function (this: { lastID: number }, err: Error | null) {
				if (err) return reject(err);

				db.get<User>(
					"SELECT * FROM user_profile WHERE id = ?",
					[this.lastID],
					(err: Error | null, row: User) => {
						if (err) return reject(err);
						resolve(row || null);
					}
				);
			}
		);
	});
}



export async function getUserAchievements(userId: number): Promise<Achievement[]> {
	return new Promise((resolve, reject) => {
		db.all(
			"SELECT * FROM user_achievements WHERE user_profile_id = ?",
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


export async function getAllUsers(): Promise<User[]> {
	return new Promise((resolve, reject) => {
		db.all("SELECT * FROM user_profile", (err: Error | null, users: User[]) => {
			if (err) reject(err);
			else resolve(users);
		});
	});
}

export async function incrementWins(userId: number): Promise<void> {
	return new Promise((resolve, reject) => {
		db.run(
			"UPDATE user_profile SET wins = wins + 1 WHERE auth_user_id = ?",
			[userId],
			function (err: Error | null) {
				if (err) reject(err);
				else resolve();
			}
		);
	});
}

export async function incrementLosses(userId: number): Promise<void> {
	return new Promise((resolve, reject) => {
	  db.run(
		"UPDATE user_profile SET losses = losses + 1 WHERE auth_user_id = ?",
		[userId],
		function (err: Error | null) {
		  if (err) reject(err);
		  else resolve();
		}
	  );
	});
  }
  