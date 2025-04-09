import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";


const dbPath = path.resolve(__dirname, "../db/data.sqlite"); // Ecole Docker
const schemaPath = path.resolve(__dirname, "schema.sql");

const db = new sqlite3.Database(dbPath, (err) => {
	if (err) {
		console.error("❌ Database connection error:", err);
	} else {
		console.log("✅ Connected to SQLite database");
		initializeDatabase();
		// seedDatabase();
	}
});

function initializeDatabase() {
	const schema = fs.readFileSync(schemaPath, "utf8");
	db.exec(schema, (err) => {
		if (err) {
			console.error("❌ Error initializing database:", err);
		} else {
			console.log("✅ Database tables initialized");
		}
	});
}




function seedDatabase() {
	db.serialize(() => {
		// Засидим несколько пользователей
		db.run(
			`INSERT INTO users (username, email, password_hash, avatar_url, is_verified, wins, losses)
		  VALUES (?, ?, ?, ?, ?, ?, ?)`,
			["alice", "alice@example.com", "hashed_password", "/uploads/avatars/alice.jpg", 1, 10, 5],
			function (err) {
				if (err) console.error(err);
				else console.log("Seeded user alice with id:", this.lastID);
			}
		);

		db.run(
			`INSERT INTO users (username, email, password_hash, avatar_url, is_verified, wins, losses)
		  VALUES (?, ?, ?, ?, ?, ?, ?)`,
			["bob", "bob@example.com", "hashed_password", "/uploads/avatars/bob.jpg", 1, 7, 8],
			function (err) {
				if (err) console.error(err);
				else console.log("Seeded user bob with id:", this.lastID);
			}
		);

		// Засидим игру между двумя пользователями (например, alice и bob)
		db.run(
			`INSERT INTO games (player1_id, player2_id, winner_id, score_player1, score_player2, game_type)
		  VALUES (?, ?, ?, ?, ?, ?)`,
			[1, 2, 1, 11, 7, "casual"],
			function (err) {
				if (err) console.error(err);
				else console.log("Seeded game with id:", this.lastID);
			}
		);

		// Засидим турнир
		db.run(
			`INSERT INTO tournaments (name, status)
		  VALUES (?, ?)`,
			["Summer Tournament", "ongoing"],
			function (err) {
				if (err) console.error(err);
				else console.log("Seeded tournament with id:", this.lastID);
			}
		);

		// Засидим участников турнира
		db.run(
			`INSERT INTO tournament_participants (tournament_id, user_id, score)
		  VALUES (?, ?, ?)`,
			[1, 1, 20],
			function (err) {
				if (err) console.error(err);
				else console.log("Seeded tournament participant with id:", this.lastID);
			}
		);

		db.run(
			`INSERT INTO tournament_participants (tournament_id, user_id, score)
		  VALUES (?, ?, ?)`,
			[1, 2, 15],
			function (err) {
				if (err) console.error(err);
				else console.log("Seeded tournament participant with id:", this.lastID);
			}
		);

		// Засидим друзей (friendship)
		db.run(
			`INSERT INTO friends (user_id, friend_id, status)
		  VALUES (?, ?, ?)`,
			[1, 2, "accepted"],
			function (err) {
				if (err) console.error(err);
				else console.log("Seeded friendship between user 1 and 2 with id:", this.lastID);
			}
		);
	});
}


export default db;
