import db from "../database";
import { GoogleUser, User} from "../@types/auth.types";
import { createDatabaseError } from "../utils/errorHandler";


export async function getUserByEmail(email: string): Promise<User | null> {
	const normalizedEmail = email.trim().toLowerCase();
	return new Promise((resolve, reject) => {
	  db.get(
		"SELECT * FROM users WHERE LOWER(email) = ?",
		[normalizedEmail],
		(err: Error | null, user: User | undefined) => {
		  if (err) {
			reject(err);
		  } else {
			resolve(user || null);
		  }
		}
	  );
	});
  }


  export async function is2FAEnabled(userId: number): Promise<boolean> {
	return new Promise((resolve, reject) => {
	  db.get(
		"SELECT * FROM users WHERE id = ? AND two_factor_enabled = 1",
		[userId],
		(err: Error | null, user: User | undefined) => {
		  if (err) {
			reject(err);
		  } else {
			resolve(!!user);
		  }
		}
	  );
	});
	  }

  export async function getUserByVerificationToken(token:string): Promise<User | null> {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT * FROM users WHERE verification_token = ?",
			[token],
			(err: Error | null, user: User | undefined) => {
				if (err) reject(err);
				else resolve(user || null);
			}
		)
	})
  }

  export async function verifyEmail(userId: number): Promise<void> {
	return new Promise<void>((resolve, reject) => {
	  db.run(
		"UPDATE users SET is_verified = 1 WHERE id = ?",
		[userId],
		function (err: Error | null) {
		  if (err) {
			reject(err);
		  } else {
			resolve();
		  }
		}
	  );
	});
  }


  export async function updateUserVerificationToken(
	userId: number,
	token: string
  ): Promise<void> {
	return new Promise<void>((resolve, reject) => {
	  db.run(
		"UPDATE users SET verification_token = ? WHERE id = ?",
		[token, userId],
		function (err: Error | null) {
		  if (err) {
			reject(err);
		  } else {
			resolve();
		  }
		}
	  );
	});
  }

  export async function updateUserData(
	userId: number,
	data: {
	  username: string;
	  email: string;
	  password_hash?: string | null;
	}
  ): Promise<User | null> {
	// Собираем массивы для строк обновления и параметров
	const updateFields: string[] = [];
	const params: any[] = [];
  
	// Для каждого поля, которое передано в data, если значение определено,
	// добавляем строку вида "ключ = ?" и соответствующий параметр.
	for (const [key, value] of Object.entries(data)) {
	  if (value !== undefined) {
		updateFields.push(`${key} = ?`);
		params.push(value);
	  }
	}
  
	// Всегда обновляем дату обновления
	updateFields.push("updated_at = datetime('now')");
	// Добавляем идентификатор пользователя для условия WHERE
	params.push(userId);
  
	const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
  
	// Выполняем SQL-запрос через Promise
	await new Promise<void>((resolve, reject) => {
	  db.run(query, params, function (err: Error | null) {
		if (err) {
		  reject(err);
		} else {
		  resolve();
		}
	  });
	});
  
	// После обновления возвращаем обновлённого пользователя
	return await getUserById(userId);
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

export async function dbCreateUser(
	username: string,
	email: string,
	password_hash: string
  ): Promise<User | null>  {
	return new Promise((resolve, reject) => {
	  db.run(
		"INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
		[username, email, password_hash],
		function (this: { lastID: number }, err: Error | null) {
		  if (err) {
			reject(err);
		  } else {
			const userId = this.lastID;
			const user = getUserById(userId);
			if (!user) {
			  reject(createDatabaseError("User creation failed"));
			} else {
			  resolve(user);
		  }
		}
	  }
	);
	});
  }

export async function createGooleUser(user: GoogleUser): Promise<number> {
	return new Promise((resolve, reject) => {
		db.run(
			"INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)",
			[user.name, user.email, user.sub],
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


export async function updateUserId(email: string, userId: number): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		db.run(
			"UPDATE users SET user_id = ? WHERE email = ?",
			[userId, email],
			function (err: Error | null) {
				if (err) return reject(err);
				resolve();
			}
		);
	});
}