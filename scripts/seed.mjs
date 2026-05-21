/**
 * Nova Panel — First-run database setup + seed
 * Creates all tables if they don't exist, then creates the admin account.
 * Safe to run multiple times (idempotent).
 */
import pg from "pg";
import crypto from "crypto";

const { Client } = pg;

function hashPassword(password) {
  return crypto
    .createHmac("sha256", "gamepanel_salt_2024")
    .update(password)
    .digest("hex");
}

async function migrate(client) {
  console.log("[seed] Running schema migrations...");

  await client.query(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('admin', 'user');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE server_status AS ENUM ('installing', 'running', 'stopped', 'starting', 'stopping', 'error');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE vps_status AS ENUM ('installing', 'running', 'stopped', 'starting', 'stopping', 'error');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE os_template AS ENUM ('ubuntu-22.04', 'ubuntu-24.04', 'debian-12', 'debian-11', 'alpine-3.19');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE backup_status AS ENUM ('pending', 'running', 'completed', 'failed');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      username      TEXT NOT NULL UNIQUE,
      first_name    TEXT NOT NULL,
      last_name     TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role          user_role NOT NULL DEFAULT 'user',
      is_active     BOOLEAN NOT NULL DEFAULT true,
      server_limit  INTEGER NOT NULL DEFAULT 0,
      vps_limit     INTEGER NOT NULL DEFAULT 0,
      discord_id    TEXT,
      created_at    TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      fqdn        TEXT NOT NULL,
      ip          TEXT NOT NULL,
      port        INTEGER NOT NULL DEFAULT 8080,
      is_online   BOOLEAN NOT NULL DEFAULT false,
      cpu_cores   INTEGER NOT NULL,
      memory_mb   INTEGER NOT NULL,
      disk_gb     INTEGER NOT NULL,
      location    TEXT,
      description TEXT,
      api_token   TEXT NOT NULL,
      created_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS locations (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      short_code  TEXT NOT NULL UNIQUE,
      description TEXT,
      country     TEXT,
      city        TEXT,
      created_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS activity (
      id            SERIAL PRIMARY KEY,
      type          TEXT NOT NULL,
      description   TEXT NOT NULL,
      user_id       INTEGER,
      username      TEXT,
      resource_id   INTEGER,
      resource_type TEXT,
      created_at    TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key        TEXT PRIMARY KEY,
      value      JSONB NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bot_config (
      id               SERIAL PRIMARY KEY,
      token            TEXT,
      client_id        TEXT,
      guild_id         TEXT,
      owner_discord_id TEXT,
      enabled          BOOLEAN NOT NULL DEFAULT false,
      status           TEXT NOT NULL DEFAULT 'offline',
      last_error       TEXT,
      started_at       TIMESTAMP,
      updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS servers (
      id              SERIAL PRIMARY KEY,
      name            TEXT NOT NULL,
      description     TEXT,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      node_id         INTEGER NOT NULL REFERENCES nodes(id),
      status          server_status NOT NULL DEFAULT 'stopped',
      game_type       TEXT NOT NULL,
      docker_image    TEXT NOT NULL,
      cpu_limit       INTEGER NOT NULL,
      memory_mb       INTEGER NOT NULL,
      disk_mb         INTEGER NOT NULL,
      ip              TEXT NOT NULL DEFAULT '0.0.0.0',
      port            INTEGER NOT NULL DEFAULT 25565,
      startup_command TEXT NOT NULL,
      env_variables   JSONB DEFAULT '{}',
      created_at      TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS vps (
      id           SERIAL PRIMARY KEY,
      name         TEXT NOT NULL,
      user_id      INTEGER NOT NULL REFERENCES users(id),
      node_id      INTEGER NOT NULL REFERENCES nodes(id),
      status       vps_status NOT NULL DEFAULT 'stopped',
      os_template  os_template NOT NULL,
      cpu_cores    INTEGER NOT NULL,
      memory_mb    INTEGER NOT NULL,
      disk_gb      INTEGER NOT NULL,
      ip_address   TEXT NOT NULL,
      username     TEXT NOT NULL DEFAULT 'root',
      ssh_port     INTEGER NOT NULL DEFAULT 22,
      container_id TEXT,
      created_at   TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS allocations (
      id          SERIAL PRIMARY KEY,
      node_id     INTEGER NOT NULL REFERENCES nodes(id),
      ip          TEXT NOT NULL,
      port        INTEGER NOT NULL,
      server_id   INTEGER REFERENCES servers(id),
      is_assigned BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS backups (
      id           SERIAL PRIMARY KEY,
      server_id    INTEGER NOT NULL REFERENCES servers(id),
      name         TEXT NOT NULL,
      size_mb      REAL NOT NULL DEFAULT 0,
      status       backup_status NOT NULL DEFAULT 'pending',
      created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name         TEXT NOT NULL,
      key_prefix   TEXT NOT NULL,
      key_hash     TEXT NOT NULL,
      allowed_ips  TEXT,
      is_active    BOOLEAN NOT NULL DEFAULT true,
      last_used_at TIMESTAMP,
      created_at   TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id                   SERIAL PRIMARY KEY,
      user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token                TEXT NOT NULL UNIQUE,
      new_password         TEXT,
      used                 BOOLEAN NOT NULL DEFAULT false,
      delivered_via_email   BOOLEAN NOT NULL DEFAULT false,
      delivered_via_discord BOOLEAN NOT NULL DEFAULT false,
      expires_at           TIMESTAMP NOT NULL,
      created_at           TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS server_databases (
      id            SERIAL PRIMARY KEY,
      server_id     INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      host          TEXT NOT NULL DEFAULT '127.0.0.1',
      port          INTEGER NOT NULL DEFAULT 3306,
      db_name       TEXT NOT NULL,
      username      TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS server_schedules (
      id          SERIAL PRIMARY KEY,
      server_id   INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      cron        TEXT NOT NULL,
      action      TEXT NOT NULL,
      payload     TEXT,
      is_active   BOOLEAN NOT NULL DEFAULT true,
      last_run_at TIMESTAMP,
      next_run_at TIMESTAMP,
      created_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS server_subusers (
      id          SERIAL PRIMARY KEY,
      server_id   INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permissions TEXT[] NOT NULL DEFAULT ARRAY['console.view'],
      created_at  TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  console.log("[seed] Schema ready.");
}

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await migrate(client);

    const { rows } = await client.query(`SELECT COUNT(*) as count FROM users`);
    const count = parseInt(rows[0].count, 10);

    if (count > 0) {
      console.log(`[seed] ${count} user(s) already exist — skipping seed.`);
      return;
    }

    const email    = process.env.ADMIN_EMAIL    ?? "admin@gamepanel.io";
    const password = process.env.ADMIN_PASSWORD ?? "admin123";
    const username = process.env.ADMIN_USERNAME ?? "admin";

    await client.query(
      `INSERT INTO users (email, username, first_name, last_name, password_hash, role, is_active, server_limit, vps_limit, created_at)
       VALUES ($1, $2, $3, $4, $5, 'admin', true, 999, 999, NOW())`,
      [email, username, "Admin", "User", hashPassword(password)]
    );

    console.log(`[seed] Admin user created: ${email} / ${password}`);
    console.log(`[seed] IMPORTANT: Change this password after first login!`);
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error("[seed] Failed:", err.message);
  process.exit(1);
});
