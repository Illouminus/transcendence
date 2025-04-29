-- Check if AI user already exists
INSERT OR IGNORE INTO user_profile (id, username, email, avatar_url)
VALUES (999999, 'AI Player', 'ai@pong.game', '/avatars/ai.png');
 
-- Make sure the AI user exists in auth_user table as well
INSERT OR IGNORE INTO auth_user (id, email, password_hash)
VALUES (999999, 'ai@pong.game', 'not_applicable'); 