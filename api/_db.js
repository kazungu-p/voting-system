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
      id_hash TEXT PRIMARY KEY,
      voted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      candidate TEXT NOT NULL,
      id_hash TEXT NOT NULL UNIQUE,
      ip_hash TEXT NOT NULL,
      voted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS voted_ips (
      ip_hash TEXT PRIMARY KEY,
      voted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
