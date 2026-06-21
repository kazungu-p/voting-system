import { neon } from "@neondatabase/serverless";

let sql;

export function getDb() {
  if (!sql) {
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

export async function initDb() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS voters (
      code TEXT PRIMARY KEY,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      candidate TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      voted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      ip TEXT PRIMARY KEY,
      attempts INTEGER DEFAULT 1,
      last_attempt TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Seed voter codes only if table is empty
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM voters`;
  if (count === 0) {
    const codes = [];
    for (let i = 0; i < 2000; i++) {
      // Generate random 8-char alphanumeric code
      const code = Array.from({ length: 8 }, () =>
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
      ).join("");
      codes.push(code);
    }
    // Insert in batches of 100
    for (let i = 0; i < codes.length; i += 100) {
      const batch = codes.slice(i, i + 100);
      await sql`
        INSERT INTO voters (code)
        SELECT * FROM UNNEST(${batch}::text[])
        ON CONFLICT DO NOTHING
      `;
    }
  }
}
