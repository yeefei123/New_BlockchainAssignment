import pool from "@/app/utils/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

interface CompanyFormData {
  campaignId: string;
  title: string;
  owner: string;
  fundsRaised?: string;
  fileUpload?: string;
  issueType?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const formData: CompanyFormData = req.body;

      const query = `
        INSERT INTO UserReports (campaign_id, campaign_title, campaign_owner, funds_raised, file_url, issue_type, status)
        VALUES (?, ?, ?, ?, ?, ?, "Pending")
      `;

      const connection = await pool.getConnection();
      const [result] = await connection.query<ResultSetHeader>(query, [
        formData.campaignId,
        formData.title,
        formData.owner,
        formData.fundsRaised || null,
        formData.fileUpload || null,
        formData.issueType || null,
      ]);
      connection.release();

      const insertId = result.insertId;

      res.status(200).json({
        message: "User report submitted successfully",
        insertId,
      });
    } catch (error) {
      console.error("Error submitting user report:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method === "GET") {
    try {
      const query = `
        SELECT * FROM UserReports WHERE status = 'Pending'
      `;

      const connection = await pool.getConnection();
      const [rows] = await connection.query<RowDataPacket[]>(query);
      connection.release();

      res.status(200).json(rows);
    } catch (error) {
      console.error("Error fetching user reports:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
