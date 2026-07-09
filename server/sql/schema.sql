-- 666 WORLDWIDE database schema
-- Applied automatically on server boot if tables do not exist.

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    member_number   VARCHAR(20) NOT NULL UNIQUE,
    bio             TEXT DEFAULT '',
    photo_filename  VARCHAR(255) DEFAULT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    phone       VARCHAR(30) NOT NULL,
    status      VARCHAR(60) NOT NULL DEFAULT 'Currently Recruiting',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_member_number ON users (member_number);
CREATE INDEX IF NOT EXISTS idx_agents_sort_order ON agents (sort_order);
