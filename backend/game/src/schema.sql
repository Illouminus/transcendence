CREATE TABLE IF NOT EXISTS matchmaking_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,  -- Ссылка на auth_user_id или user_profile_id, без FK
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('waiting', 'matched')) NOT NULL DEFAULT 'waiting'
);

CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,   -- user_id / user_profile_id
    player2_id INTEGER NOT NULL,   -- ...
    winner_id INTEGER DEFAULT NULL,
    score_player1 INTEGER DEFAULT 0,
    score_player2 INTEGER DEFAULT 0,
    game_type TEXT CHECK(game_type IN ('casual', 'tournament')) NOT NULL DEFAULT 'casual',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    status TEXT CHECK(status IN ('pending', 'ongoing', 'completed')) NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tournament_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, -- user_profile_id или auth_user_id
    score INTEGER DEFAULT 0
    -- FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);