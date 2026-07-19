PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL CHECK (pack_id = 'first-light-garden'),
  recovery_code_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'revoked')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  stripe_session_id TEXT PRIMARY KEY,
  stripe_payment_intent_id TEXT UNIQUE,
  pack_id TEXT NOT NULL CHECK (pack_id = 'first-light-garden'),
  amount_total INTEGER NOT NULL CHECK (amount_total = 700),
  currency TEXT NOT NULL CHECK (currency = 'hkd'),
  payment_status TEXT NOT NULL CHECK (payment_status = 'paid'),
  install_id_hash TEXT NOT NULL,
  entitlement_id TEXT NOT NULL REFERENCES entitlements(id),
  created_at TEXT NOT NULL,
  fulfilled_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS purchases_install_id_hash_idx ON purchases(install_id_hash);
CREATE INDEX IF NOT EXISTS purchases_entitlement_id_idx ON purchases(entitlement_id);

CREATE TABLE IF NOT EXISTS checkout_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  install_id_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS checkout_attempts_install_time_idx
  ON checkout_attempts(install_id_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS api_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS api_attempts_scope_key_time_idx
  ON api_attempts(scope, key_hash, created_at DESC);
