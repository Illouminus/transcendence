import db from "../database";
import sqlite3 from "sqlite3";


export function createTournamentDB(hostId: number): Promise<number> {
	return new Promise((resolve, reject) => {
		db.run(
			`INSERT INTO tournaments (status, host_id) VALUES (?, ?)`,
			['waiting', hostId],
			function (this: sqlite3.RunResult, err) {
				if (err) {
					reject(err);
				} else {
					resolve(this.lastID);
				}
			}
		);
	});
}