import { getDb, initDb } from "./_db.js";

const CANDIDATES = [
  "Seth Opollo",
  "Victor Wanyama",
  "Ojay",
  "Fatuma Kapera",
];

// Simple in-memory rate limiter (per serverless instance)
const ipAttempts = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipAttempts.get(ip) || { count: 0, windowStart: now };

  // Reset window every 15 minutes
  if (now - entry.windowStart > 15 * 60 * 1000) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count++;
  ipAttempts.set(ip, entry);

  // Allow max 10 attempts per 15 min per IP
  return entry.count > 10;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many attempts. Please try again later." });
  }

  const { code, candidate } = req.body || {};

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Voter code is required." });
  }
  if (!CANDIDATES.includes(candidate)) {
    return res.status(400).json({ error: "Invalid candidate." });
  }

  try {
    await initDb();
    const sql = getDb();

    const [voter] = await sql`SELECT * FROM voters WHERE code = ${code.trim().toUpperCase()}`;

    if (!voter) {
      return res.status(400).json({ error: "Invalid voter code." });
    }
    if (voter.used) {
      return res.status(400).json({ error: "This code has already been used." });
    }

    await sql`INSERT INTO votes (candidate, code) VALUES (${candidate}, ${code.trim().toUpperCase()})`;
    await sql`UPDATE voters SET used = TRUE WHERE code = ${code.trim().toUpperCase()}`;

    const results = await sql`
      SELECT candidate, COUNT(*)::int AS votes
      FROM votes
      GROUP BY candidate
      ORDER BY votes DESC
    `;

    return res.status(200).json({ success: true, results });
  } catch (err) {
    console.error("Vote error:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}
