-- Migration 001: Create users table for Google OAuth sign-in
CREATE TABLE IF NOT EXISTS users (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT        NOT NULL UNIQUE,
  google_oauth_token TEXT        NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
