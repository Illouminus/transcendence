import { DbGame } from "../@types/game.types";
import { DbTournament, DbTournamentMatch, TournamentMatch } from "../@types/tournament.types";
import db from "../database";
import sqlite3 from "sqlite3";

export function createTournamentDB(hostId: number): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO tournaments (status, host_id) VALUES (?, ?)`,
      ['waiting', hostId],
      function (this: sqlite3.RunResult, err: string) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

export function insertUserTournamentDB(tournamentId: number, userId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO tournament_players (tournament_id, user_id) VALUES (?, ?)`,
      [tournamentId, userId],
      function (this: sqlite3.RunResult, err: string) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

export function getTournamentDB(tournamentId: number): Promise<DbTournament | undefined> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM tournaments WHERE id = ?`,
      [tournamentId],
      (err: string, row: DbTournament) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

export function getTournamentPlayersDB(tournamentId: number): Promise<DbTournament[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, status, host_id, created_at, completed_at FROM tournaments WHERE id = ?`,
      [tournamentId],
      (err: string, rows: DbTournament[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

export function getExistingPlayersDB(tournamentId: number): Promise<number[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT user_id FROM tournament_players WHERE tournament_id = ?`,
      [tournamentId],
      (err: string, rows: { user_id: number }[]) => {
        if (err) {
          reject(err);
        } else {
          const ids = rows.map(row => row.user_id);
          resolve(ids);
        }
      }
    );
  });
}

export function updateReadyDB(tournamentId: number, userId: number, ready: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE tournament_players SET ready = ? WHERE tournament_id = ? AND user_id = ?`,
      [ready, tournamentId, userId],
      function (this: sqlite3.RunResult, err: string) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

export function insertMatchDB(tournamentId: number, player1Id: number, player2Id: number, matchType: string): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO tournament_matches (tournament_id, player1_id, player2_id, match_type) VALUES (?, ?, ?, ?)`,
      [tournamentId, player1Id, player2Id, matchType],
      function (err: Error | null) {
        if (err) reject(err);
        else resolve(this.lastID); // <== ЭТО ВАЖНО
      }
    );
  });
}

export function updateMatchWithGameDB(gameId: number, tournamentId: number, player1Id: number, player2Id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE tournament_matches SET game_id = ?, started_at = CURRENT_TIMESTAMP WHERE tournament_id = ? AND player1_id = ? AND player2_id = ?`,
      [gameId, tournamentId, player1Id, player2Id],
      function (err: string) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function completeMatchDB(matchId: number, winnerId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE tournament_matches SET winner_id = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [winnerId, matchId],
      function (err: string) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function insertFinalMatchDB(tournamentId: number, player1Id: number, player2Id: number): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO tournament_matches (tournament_id, player1_id, player2_id, match_type) VALUES (?, ?, ?, 'final')`,
      [tournamentId, player1Id, player2Id],
      function (err: Error | null) {
        if (err) reject(err);
        else resolve(this.lastID); // <== ТОЖЕ СЮДА
      }
    );
  });
}

export function getGameById(gameId: number): Promise<DbGame | undefined> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, tournament_match_id, match_id, game_type FROM games WHERE id = ?`,
      [gameId],
      (err: string, row: DbGame) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

export function getMatchById(matchId: number): Promise<DbTournamentMatch | undefined> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM tournament_matches WHERE id = ?`,
      [matchId],
      (err: string, row: DbTournamentMatch) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

export function getSemifinalWinners(tournamentId: number): Promise<DbTournamentMatch[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM tournament_matches WHERE tournament_id = ? AND match_type = 'semifinal'`,
      [tournamentId],
      (err: string, rows: DbTournamentMatch[]) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

export function setTournamentWinner(tournamentId: number, winnerId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE tournaments SET status = 'completed', winner_id = ?,  completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [winnerId, tournamentId],
      function (err: string) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function getTournamentPlayers(tournamentId: number): Promise<Array<{ user_id: number }>> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT user_id FROM tournament_players WHERE tournament_id = ?`,
      [tournamentId],
      (err: string, rows: { user_id: number }[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
  });
}