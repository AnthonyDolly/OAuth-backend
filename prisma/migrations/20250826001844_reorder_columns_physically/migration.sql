-- Reorder columns physically in MySQL database
-- Move created_at to be before expires_at in both tables

-- Reorder created_at in refresh_tokens table (after jti, before expires_at)
ALTER TABLE `refresh_tokens` MODIFY COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER `jti`;

-- Reorder created_at in user_sessions table (after session_token, before expires_at)  
ALTER TABLE `user_sessions` MODIFY COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER `session_token`;