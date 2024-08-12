import pool from "@/app/utils/db";
import { ResultSetHeader } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { id },
    method,
  } = req;

  if (method === "PUT") {
    try {
      const campaign_id = id as string;
      const query = `
        UPDATE userReports SET status = 'Approved' WHERE campaign_id = ?
      `;

      const connection = await pool.getConnection();
      const [result] = await connection.query<ResultSetHeader>(query, [
        campaign_id,
      ]);
      connection.release();

      if (result.affectedRows > 0) {
        res.status(200).json({ message: "Company accepted successfully" });
      } else {
        res.status(404).json({ error: "Company not found" });
      }
    } catch (error) {
      console.error("Error accepting company:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
