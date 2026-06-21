import { getDb, initDb } from "./_db.js";
import { createHash } from "crypto";

const CANDIDATES = [
  "Seth Opollo",
  "Paul Wanyama",
  "Ojay",
  "Fatuma Kapera",
  "Sir Maurice",
  "Makazi",
  "Mohammed Mzee Kindoro",
];

const ipAttempts = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipAttempts.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > 15 * 60 * 1000) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count++;
  ipAttempts.set(ip, entry);
  return entry.count > 10;
}

function isValidId(id) {
  return /^\d{8}$/.test(id);
}

function hashId(id) {
  return createHash("sha256").update(id + process.env.SESSION_SECRET).digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many attempts. Please try again later." });
  }

  const { idNumber, candidate } = req.body || {};

  if (!idNumber || !isValidId(idNumber)) {
    return res.status(400).json({ error: "Please enter a valid 8-digit ID number." });
  }
  if (!CANDIDATES.includes(candidate)) {
    return res.status(400).json({ error: "Invalid candidate." });
  }

  const idHash = hashId(idNumber);

  try {
    await initDb();
    const sql = getDb();

    const [existing] = await sql`SELECT id_hash FROM voters WHERE id_hash = ${idHash}`;
    if (existing) {
      return res.status(400).json({ error: "This ID number has already been used to vote." });
    }

    await sql`INSERT INTO votes (candidate, id_hash) VALUES (${candidate}, ${idHash})`;
    await sql`INSERT INTO voters (id_hash) VALUES (${idHash})`;

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
