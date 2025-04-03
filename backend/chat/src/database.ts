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
		seedDatabase();
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
        // Créer une conversation entre Alice (id 1) et Bob (id 2)
        db.run(
            `INSERT INTO conversations (user1_id, user2_id)
            VALUES (?, ?)
            ON CONFLICT(user1_id, user2_id) DO NOTHING`,
            [1, 2],
            function (err) {
                if (err) console.error(err);
                else console.log("Seeded conversation between Alice and Bob with id:", this.lastID);
            }
        );

        // Ajouter des messages à la conversation
        db.run(
            `INSERT INTO messages (conversation_id, sender_id, content)
            VALUES (?, ?, ?)`,
            [1, 1, "Salut Bob, comment ça va ?"],
            function (err) {
                if (err) console.error(err);
                else console.log("Seeded message from Alice to Bob with id:", this.lastID);
            }
        );

        db.run(
            `INSERT INTO messages (conversation_id, sender_id, content)
            VALUES (?, ?, ?)`,
            [1, 2, "Salut Alice ! Ça va bien, et toi ?"],
            function (err) {
                if (err) console.error(err);
                else console.log("Seeded message from Bob to Alice with id:", this.lastID);
            }
        );

        db.run(
            `INSERT INTO messages (conversation_id, sender_id, content)
            VALUES (?, ?, ?)`,
            [1, 1, "Je vais bien aussi, merci !"],
            function (err) {
                if (err) console.error(err);
                else console.log("Seeded message from Alice to Bob with id:", this.lastID);
            }
        );
    });
}

export default db;
