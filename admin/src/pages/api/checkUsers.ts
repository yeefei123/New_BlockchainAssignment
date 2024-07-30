import pool from "@/app/utils/db";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { walletAddress, password } = req.body;

    if (!walletAddress || !password) {
      return res
        .status(400)
        .json({ error: "Wallet address and password are required." });
    }

    try {
      const query = `
        SELECT * FROM users WHERE wallet_address = ? AND password = ?
      `;

      const connection = await pool.getConnection();
      const [rows] = await connection.query(query, [walletAddress, password]);
      connection.release();

      if (Array.isArray(rows) && rows.length > 0) {
        res.status(200).json({ success: true });
      } else {
        res.status(401).json({ error: "Incorrect password." });
      }
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method === "GET") {
    const { walletAddress } = req.query;

    try {
      const query = `
        SELECT * FROM users WHERE wallet_address = ?
      `;

      const connection = await pool.getConnection();
      const [rows] = await connection.query(query, [walletAddress]);
      connection.release();

      if (Array.isArray(rows) && rows.length > 0) {
        res.status(200).json({ exists: true, user: rows[0] });
      } else {
        res.status(404).json({ exists: false });
      }
    } catch (error) {
      console.error("Error querying database:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
