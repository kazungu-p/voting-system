import { serialize } from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body || {};

  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;

  if (!validUser || !validPass) {
    return res.status(500).json({ error: "Admin credentials not configured." });
  }

  if (username === validUser && password === validPass) {
    // Set a signed session cookie
    const token = Buffer.from(`${validUser}:${process.env.SESSION_SECRET}`).toString("base64");
    res.setHeader(
      "Set-Cookie",
      serialize("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 4, // 4 hours
        path: "/",
      })
    );
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: "Invalid credentials." });
}
