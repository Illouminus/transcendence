import db from "../database";
import { CountRow } from "../@types/user.types";



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


export async function insertMatchmakingQueue(userId: number) : Promise<number> {
	return new Promise((resolve, reject) => {
		db.run(
			`
			INSERT INTO matchmaking_queue (user_id, status, joined_at)
			VALUES (?, 'waiting', datetime('now'))
		`,
			[userId],
			function (this: { lastID: number }, err: Error | null) {
				if (err) {
					reject(err);
				} else {
					const newId = this.lastID;
					console.log(`User ${userId} added to matchmaking queue with ID ${newId}`);
					resolve(newId);
				}
			}
		);
	}
	);
}


export async function startOrdinaryGame(player1_id: number, player2_id: number) : Promise<number> {
	return new Promise((resolve, reject) => {
		db.run(
			`
			INSERT INTO games (player1_id, player2_id, game_type, started_at)
			VALUES (?, ?, 'casual', datetime('now'))
		`,
			[player1_id, player2_id],
			function (this: { lastID: number }, err: Error | null) {
				if (err) {
					reject(err);
				} else {
					const newId = this.lastID;
					console.log(`Ordinary game created with ID ${newId}`);
					resolve(newId);
				}
			}
		);
	});
}

export async function updateGame(gameId: number, player1Score: number, player2Score: number) : Promise<void> {
	return new Promise((resolve, reject) => {
		db.run(
			`
			UPDATE games
			SET score_player1 = ?, score_player2 = ? end_at = datetime('now') winner_id = ?
			WHERE id = ?
		`,
			[player1Score, player2Score, player1Score > player2Score ? 1 : 2, gameId],
			function (this: { changes: number }, err: Error | null) {
				if (err) {
					reject(err);
				} else {
					console.log(`Game with ID ${gameId} updated`);
					resolve();
				}
			}
		);
	});
}