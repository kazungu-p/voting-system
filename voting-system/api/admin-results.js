import { parse } from "cookie";
import { getDb, initDb } from "./_db.js";

function isAuthorized(req) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.admin_session;
  if (!token) return false;

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

    const [{ total_voters }] = await sql`SELECT COUNT(*)::int AS total_voters FROM voters`;
    const [{ votes_cast }] = await sql`SELECT COUNT(*)::int AS votes_cast FROM votes`;

    return res.status(200).json({ results, total_voters, votes_cast });
  } catch (err) {
    console.error("Results error:", err);
    return res.status(500).json({ error: "Server error." });
  }
}
