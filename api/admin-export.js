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

    const voters = await sql`SELECT code, used FROM voters ORDER BY code`;

    const csv = ["Code,Status", ...voters.map((v) => `${v.code},${v.used ? "Used" : "Unused"}`)].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=voter-codes.csv");
    return res.status(200).send(csv);
  } catch (err) {
    console.error("Export error:", err);
    return res.status(500).json({ error: "Server error." });
  }
}
