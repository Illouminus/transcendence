import { DbTournament } from "../@types/tournament.types";
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
			`SELECT id, status, host_id, created_at, completed_at FROM tournaments WHERE id = ?`,
			[tournamentId],
			(err: string, row: DbTournament) => {
				if (err) {
					reject(err);
				} else {
					resolve(row);
				}
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