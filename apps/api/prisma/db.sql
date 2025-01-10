-- Load UUID extension
SELECT load_extension('uuid');
-- PERMANENT TABLES --
-- User table
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    default_role_id TEXT,
    full_name TEXT NOT NULL,
    position TEXT,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    password TEXT NOT NULL,
    verification_status TEXT DEFAULT 'INITIAL_REGISTERED',
    is_active INTEGER DEFAULT 1,
    is_email_verified INTEGER DEFAULT 0,
    is_phone_verified INTEGER DEFAULT 0,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_email UNIQUE(email),
    CONSTRAINT unique_phone UNIQUE(phone_number),
    CONSTRAINT valid_status CHECK (
        verification_status IN (
            'INITIAL_REGISTERED',
            'VERIFIED',
            'REJECTED',
            'PENDING'
        )
    )
);
-- Role & Permission tables
CREATE TABLE IF NOT EXISTS role (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    role_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_role (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES user(id),
    FOREIGN KEY(role_id) REFERENCES role(id)
);
CREATE TABLE IF NOT EXISTS privilege (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    privilege_name TEXT NOT NULL,
    description TEXT,
    privilege_group TEXT,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS role_privilege (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    role_id TEXT NOT NULL,
    privilege_id TEXT NOT NULL,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(role_id) REFERENCES role(id),
    FOREIGN KEY(privilege_id) REFERENCES privilege(id)
);
-- TEMPORARY TABLES --
-- OTPs table (temporary for fast verification)
CREATE TABLE IF NOT EXISTS otps (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    code TEXT NOT NULL,
    identifier TEXT NOT NULL,
    type TEXT NOT NULL,
    purpose TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    daily_count INTEGER DEFAULT 0,
    daily_count_reset DATETIME,
    blocked_until DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used INTEGER NOT NULL DEFAULT 0
);
-- Blacklisted tokens (temporary for session management)
CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    token TEXT NOT NULL,
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES user(id)
);
-- INDEXES --
CREATE INDEX user_email_idx ON user(email);
CREATE INDEX user_phone_number_idx ON user(phone_number);
CREATE INDEX user_default_role_id_idx ON user(default_role_id);
CREATE INDEX role_name_idx ON role(name);
CREATE INDEX role_role_type_idx ON role(role_type);
CREATE INDEX user_role_user_id_idx ON user_role(user_id);
CREATE INDEX user_role_role_id_idx ON user_role(role_id);
CREATE INDEX privilege_privilege_name_idx ON privilege(privilege_name);
CREATE INDEX privilege_privilege_group_idx ON privilege(privilege_group);
CREATE INDEX otps_identifier_idx ON otps(identifier);
CREATE INDEX otps_type_idx ON otps(type);
CREATE INDEX otps_purpose_idx ON otps(purpose);
CREATE INDEX otps_used_idx ON otps(used);
CREATE INDEX blacklisted_tokens_user_id_idx ON blacklisted_tokens(user_id);
CREATE INDEX blacklisted_tokens_token_idx ON blacklisted_tokens(token);
-- TRIGGERS --
CREATE TRIGGER IF NOT EXISTS blacklisted_tokens_updated_at
AFTER
UPDATE ON blacklisted_tokens BEGIN
UPDATE blacklisted_tokens
SET updated_at = CURRENT_TIMESTAMP
WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS user_updated_at
AFTER
UPDATE ON user BEGIN
UPDATE user
SET updated_at = CURRENT_TIMESTAMP
WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS role_updated_at
AFTER
UPDATE ON role BEGIN
UPDATE role
SET updated_at = CURRENT_TIMESTAMP
WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS user_role_updated_at
AFTER
UPDATE ON user_role BEGIN
UPDATE user_role
SET updated_at = CURRENT_TIMESTAMP
WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS privilege_updated_at
AFTER
UPDATE ON privilege BEGIN
UPDATE privilege
SET updated_at = CURRENT_TIMESTAMP
WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS role_privilege_updated_at
AFTER
UPDATE ON role_privilege BEGIN
UPDATE role_privilege
SET updated_at = CURRENT_TIMESTAMP
WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS otps_updated_at
AFTER
UPDATE ON otps BEGIN
UPDATE otps
SET updated_at = CURRENT_TIMESTAMP
WHERE id = NEW.id;
END;