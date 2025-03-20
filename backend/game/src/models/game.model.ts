import db from "../database";
import { User, CountRow } from "../@types/user.types";


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
  


export async function getUserById(id: number): Promise<User | null> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT * FROM user_profile WHERE auth_user_id = ?",
			[id],
			(err: Error | null, user: User | undefined) => {
				if (err) reject(err);
				else resolve(user || null);
			}
		);
	});
}

export async function createUser( userId: number, username: string, avatar_url: string ): Promise<void> {
	return new Promise((resolve, reject) => {
		db.run(
			"INSERT INTO user_profile (auth_user_id, username, avatar_url) VALUES (?, ?, ?)",
			[userId, username, avatar_url],
			function (err: Error | null) {
				if (err) reject(err);
				else resolve();
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
