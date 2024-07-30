import pool from "@/app/utils/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

interface CompanyFormData {
  name: string;
  icNumber: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  profileImageUrl?: string;
  icImageUrl?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const formData: CompanyFormData = req.body;

      const query = `
        INSERT INTO users (name, ic_number, email, phone_number, address, profile_image_url, ic_image_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, "Pending")
      `;

      const connection = await pool.getConnection();
      const [result] = await connection.query<ResultSetHeader>(query, [
        formData.name,
        formData.icNumber,
        formData.email,
        formData.phoneNumber || null,
        formData.address || null,
        formData.profileImageUrl || null,
        formData.icImageUrl || null,
      ]);
      connection.release();

      const insertId = result.insertId;

      res.status(200).json({
        message: "Company registered successfully",
        insertId,
      });
    } catch (error) {
      console.error("Error registering company:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method === "GET") {
    try {
      if (req.query.wallet_address) {
        const { wallet_address } = req.query;

        if (typeof wallet_address !== "string") {
          res.status(400).json({ error: "Invalid wallet address" });
          return;
        }

        const query = `
          SELECT * FROM users WHERE wallet_address = ?
        `;

        const connection = await pool.getConnection();
        const [rows] = await connection.query<RowDataPacket[]>(query, [
          wallet_address,
        ]);
        connection.release();

        res.status(200).json(rows);
      } else {
        const query = `
          SELECT * FROM users WHERE status = 'Pending'
        `;

        const connection = await pool.getConnection();
        const [rows] = await connection.query<RowDataPacket[]>(query);
        connection.release();

        res.status(200).json(rows);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
