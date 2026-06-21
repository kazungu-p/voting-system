export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body || {};

  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!validUser || !validPass || !secret) {
    return res.status(500).json({ error: "Server misconfiguration." });
  }

  if (username === validUser && password === validPass) {
    const token = Buffer.from(`${validUser}:${secret}`).toString("base64");
    res.setHeader(
      "Set-Cookie",
      `admin_session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 4}; SameSite=Strict`
    );
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: "Invalid credentials." });
}
