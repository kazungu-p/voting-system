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

  // Stores hashed ID numbers that have already voted
  await sql`
    CREATE TABLE IF NOT EXISTS voters (
      id_hash TEXT PRIMARY KEY,
      voted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      candidate TEXT NOT NULL,
      id_hash TEXT NOT NULL UNIQUE,
      voted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
