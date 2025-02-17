import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import db from "../database";
import { RegisterBody, LoginBody, User } from "../types/auth.types"

export async function register(req: FastifyRequest<{ Body: RegisterBody }>, res: FastifyReply) {
	const { username, email, password } = req.body;

	if (!username || !email || !password) {
		return res.status(400).send({ error: "All fields are required" });
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	try {
		const userId = await new Promise<number>((resolve, reject) => {
			db.run(
				"INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
				[username, email, hashedPassword],
				function (err) {
					if (err) {
						reject(err);
					} else {
						resolve(this.lastID);
					}
				}
			);
		});

		return res.status(201).send({ message: "User registered!", userId });

	} catch (error) {
		console.error("❌ Registration error:", error);
		return res.status(500).send({ error: "User already exists" });
	}
}




async function getUserByEmail(email: string): Promise<User | null> {
	return new Promise((resolve, reject) => {
		db.get("SELECT * FROM users WHERE email = ?", [email], (err, user: User | undefined) => {
			if (err) reject(err);
			resolve(user || null);
		});
	});
}

export async function login(req: FastifyRequest<{ Body: LoginBody }>, res: FastifyReply) {
	const { email, password } = req.body;

	console.log(req.body);
	if (!email || !password) {
		return res.status(400).send({ error: "Email and password are required" });
	}

	try {
		const user = await getUserByEmail(email);

		if (!user || !(await bcrypt.compare(password, user.password_hash))) {
			return res.status(401).send({ error: "Invalid credentials" });
		}

		const token = req.server.jwt.sign({ id: user.id, email: user.email });

		res.setCookie("token", token, { httpOnly: true, secure: false });

		return res.send({ message: "Login successful!", token });

	} catch (error) {
		console.error("❌ Login error:", error);
		return res.status(500).send({ error: "Internal Server Error" });
	}
}