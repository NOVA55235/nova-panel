/**
 * Nova Panel — First-run database seed
 * Creates the admin account if no users exist.
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

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // Check if any users exist
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
