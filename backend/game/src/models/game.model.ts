import db from "../database";
import { CountRow } from "../@types/user.types";
import { GameType } from "../@types/tournament.types";


export async function getTotalGamesPlayed(userId: number): Promise<number> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT COUNT(*) AS totalGames FROM games WHERE player1_id = ? OR player2_id = ?",
			[userId, userId],
			(err: Error | null, row: unknown) => {
				if (err) {
					console.error("Error retrieving total games:", err);
					reject(err);
				} else {
					const countRow = row as CountRow;
					console.log("Total games:", countRow.totalGames);
					resolve(countRow.totalGames || 0);
				}
			}
		);
	});
}


export async function getTotalTournaments(userId: number): Promise<number> {
	
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT COUNT(*) AS totalTournaments FROM tournament_players WHERE user_id = ?",
			[userId],
			(err: Error | null, row: unknown) => {
				if (err) {
					console.error("Error retrieving total tournaments:", err);
					reject(err);
				} else {
					const countRow = row as CountRow;
					console.log("Total Tournament:", countRow.totalTournaments);
					resolve(countRow.totalTournaments || 0);
				}
			}
		);
	});
}


export async function getTournamentWins(userId: number): Promise<number> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT COUNT(*) AS tournamentWins FROM tournament_matches WHERE winner_id = ?",
			[userId],
			(err: Error | null, row: unknown) => {
				if (err) {
					console.error("Error retrieving tournament wins:", err);
					reject(err);
				} else {
					const countRow = row as CountRow;
					console.log("Tournament Wins:", countRow.tournamentWins);
					resolve(countRow.tournamentWins || 0);
				}
			}
		);
	});
}

export async function getGameWins(userId: number): Promise<number> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT COUNT(*) AS totalWins FROM games WHERE winner_id = ?",
			[userId],
			(err: Error | null, row: unknown) => {
				if (err) {
					console.error("Error retrieving game wins:", err);
					reject(err);
				} else {
					const countRow = row as CountRow;
					console.log("Total Game Wins:", countRow.totalWins);
					resolve(countRow.totalWins || 0);
				}
			}
		);
	});
}

export async function getGameLosses(userId: number): Promise<number> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT COUNT(*) AS totalLosses FROM games WHERE (player1_id = ? OR player2_id = ?) AND winner_id != ? AND winner_id IS NOT NULL",
			[userId, userId, userId],
			(err: Error | null, row: unknown) => {
				if (err) {
					console.error("Error retrieving game losses:", err);
					reject(err);
				} else {
					const countRow = row as CountRow;
					console.log("Total Game Losses:", countRow.totalLosses);
					resolve(countRow.totalLosses || 0);
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

export async function startOrdinaryGame(
	player1_id: number,
	player2_id: number,
	game_type: GameType = 'casual',
	tournament_match_id?: number
  ): Promise<number> {

	console.log(`Starting game between ${player1_id} and ${player2_id} [type: ${game_type}] and tournament match ID: ${tournament_match_id}`);
	return new Promise((resolve, reject) => {
	  db.run(
		`
		INSERT INTO games (player1_id, player2_id, game_type, tournament_match_id, started_at)
		VALUES (?, ?, ?, ?, datetime('now'))
		`,
		[player1_id, player2_id, game_type, tournament_match_id || null],
		function (this: { lastID: number }, err: Error | null) {
		  if (err) {
			reject(err);
		  } else {
			const newId = this.lastID;
			console.log(`Game created with ID ${newId} [type: ${game_type}]`);
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

export async function getUserGames(userId: number): Promise<any[]> {
	return new Promise((resolve, reject) => {
		db.all(
			`
			SELECT 
				id as game_id,
				game_type,
				started_at,
				score_player1,
				score_player2,
				winner_id,
				player1_id,
				player2_id
			FROM games
			WHERE player1_id = ? OR player2_id = ?
			ORDER BY started_at DESC
		`,
			[userId, userId],
			(err: Error | null, rows: any[]) => {
				if (err) {
					reject(err);
				} else {
					resolve(rows);
				}
			}
		);
	});
}

export function insertGameDB(
	player1Id: number,
	player2Id: number,
	gameType: GameType = 'casual',
	tournamentMatchId?: number
  ): Promise<number> {
	return new Promise((resolve, reject) => {
	  db.run(
		`INSERT INTO games (player1_id, player2_id, game_type, tournament_match_id, started_at)
		 VALUES (?, ?, ?, ?, datetime('now'))`,
		[player1Id, player2Id, gameType, tournamentMatchId || null],
		function (this: { lastID: number }, err: Error | null) {
		  if (err) reject(err);
		  else resolve(this.lastID);
		}
	  );
	});
  }
  
  export function updateGameResultDB(
	gameId: number,
	winnerId: number,
	score1: number,
	score2: number
  ): Promise<void> {
	return new Promise((resolve, reject) => {
	  db.run(
		`UPDATE games
		 SET winner_id = ?, score_player1 = ?, score_player2 = ?, ended_at = datetime('now')
		 WHERE id = ?`,
		[winnerId, score1, score2, gameId],
		function (err: Error | null) {
		  if (err) reject(err);
		  else resolve();
		}
	  );
	});
  }
  
  export function getGameMetaDB(
	gameId: number
  ): Promise<{ game_type: GameType; tournament_match_id: number | null } | undefined> {
	return new Promise((resolve, reject) => {
	  db.get(
		`SELECT game_type, tournament_match_id FROM games WHERE id = ?`,
		[gameId],
		(err: string, row: any) => {
		  if (err) reject(err);
		  else resolve(row);
		}
	  );
	});
  }
  

  
