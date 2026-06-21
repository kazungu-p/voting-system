import { getDb, initDb } from "./_db.js";

function isAuthorized(req) {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  if (!match) return false;
  const token = match[1];
  const expected = Buffer.from(
    `${process.env.ADMIN_USERNAME}:${process.env.SESSION_SECRET}`
  ).toString("base64");
  return token === expected;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await initDb();
    const sql = getDb();

    const results = await sql`
      SELECT candidate, COUNT(*)::int AS votes
      FROM votes
      GROUP BY candidate
      ORDER BY votes DESC
    `;

    const [{ votes_cast }] = await sql`SELECT COUNT(*)::int AS votes_cast FROM votes`;

    return res.status(200).json({ results, votes_cast });
  } catch (err) {
    console.error("Results error:", err);
    return res.status(500).json({ error: "Server error." });
  }
}
