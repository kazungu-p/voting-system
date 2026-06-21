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

// In-memory rate limiter (blocks brute force within a serverless instance)
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

function hashValue(value) {
  return createHash("sha256").update(value + process.env.SESSION_SECRET).digest("hex");
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

  const idHash = hashValue(idNumber);
  const ipHash = hashValue(ip);

  try {
    await initDb();
    const sql = getDb();

    // Check if this IP has already voted
    const [votedIp] = await sql`SELECT ip_hash FROM voted_ips WHERE ip_hash = ${ipHash}`;
    if (votedIp) {
      return res.status(400).json({ error: "A vote has already been cast from this device." });
    }

    // Check if this ID has already voted
    const [votedId] = await sql`SELECT id_hash FROM voters WHERE id_hash = ${idHash}`;
    if (votedId) {
      return res.status(400).json({ error: "This ID number has already been used to vote." });
    }

    // Record the vote, ID hash, and IP hash
    await sql`INSERT INTO votes (candidate, id_hash, ip_hash) VALUES (${candidate}, ${idHash}, ${ipHash})`;
    await sql`INSERT INTO voters (id_hash) VALUES (${idHash})`;
    await sql`INSERT INTO voted_ips (ip_hash) VALUES (${ipHash})`;

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
