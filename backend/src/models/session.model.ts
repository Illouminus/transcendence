import db from "../database";

export async function save2FACode(
  userId: number,
  code: string,
  expiresAt: string,
) {
  return new Promise<void>((resolve, reject) => {
    db.get(
      "SELECT id FROM sessions WHERE user_id = ?",
      [userId],
      (err: string, session: string) => {
        if (err) return reject(err);

        if (session) {
          db.run(
            "UPDATE sessions SET two_factor_code = ?, expires_at = ? WHERE user_id = ?",
            [code, expiresAt, userId],
            function (err: string) {
              if (err) reject(err);
              resolve();
            },
          );
        } else {
          db.run(
            "INSERT INTO sessions (user_id, jwt_token, two_factor_code, expires_at, created_at) VALUES (?, NULL, ?, ?, ?)",
            [userId, code, expiresAt, new Date().toISOString()],
            function (err: string) {
              if (err) reject(err);
              resolve();
            },
          );
        }
      },
    );
  });
}

export async function verify2FACode(userId: number, code: string) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM sessions WHERE user_id = ? AND two_factor_code = ?",
      [userId, code],
      (err: string, session: string) => {
        if (err) reject(err);
        resolve(session || null);
      },
    );
  });
}

export async function updateJWT(userId: number, token: string) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      "UPDATE sessions SET jwt_token = ?, two_factor_code = NULL WHERE user_id = ?",
      [token, userId],
      function (err: string) {
        if (err) reject(err);
        resolve();
      },
    );
  });
}
