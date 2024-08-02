import pool from "@/app/utils/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

interface CompanyFormData {
  name: string;
  password: string;
  walletAddress: string;
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
      const { walletAddress } = formData;

      const connection = await pool.getConnection();

      // Check if the wallet_address already exists
      const checkQuery = `
        SELECT COUNT(*) AS count FROM users WHERE wallet_address = ?
      `;
      const [checkResult] = await connection.query<RowDataPacket[]>(
        checkQuery,
        [walletAddress]
      );
      const { count } = checkResult[0];

      let result;

      if (count > 0) {
        // Update the existing row
        const updateQuery = `
          UPDATE users SET 
            name = ?, 
            password = ?, 
            ic_number = ?, 
            email = ?, 
            phone_number = ?, 
            address = ?, 
            profile_image_url = ?, 
            ic_image_url = ? ,
            status = "Pending"
          WHERE wallet_address = ?
        `;
        [result] = await connection.query<ResultSetHeader>(updateQuery, [
          formData.name,
          formData.password,
          formData.icNumber,
          formData.email,
          formData.phoneNumber || null,
          formData.address || null,
          formData.profileImageUrl || null,
          formData.icImageUrl || null,
          walletAddress,
        ]);
      } else {
        // Insert a new row
        const insertQuery = `
          INSERT INTO users (name, password, wallet_address, ic_number, email, phone_number, address, profile_image_url, ic_image_url, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "Pending")
        `;
        [result] = await connection.query<ResultSetHeader>(insertQuery, [
          formData.name,
          formData.password,
          walletAddress,
          formData.icNumber,
          formData.email,
          formData.phoneNumber || null,
          formData.address || null,
          formData.profileImageUrl || null,
          formData.icImageUrl || null,
          "Pending",
        ]);
      }

      connection.release();
      const affectedRows = result.affectedRows;

      res.status(200).json({
        message:
          count > 0
            ? "Company updated successfully"
            : "Company registered successfully",
        affectedRows,
      });
    } catch (error) {
      console.error("Error processing request:", error);
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
