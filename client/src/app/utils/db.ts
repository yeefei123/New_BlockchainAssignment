import { createPool } from "mysql2/promise";

const pool = createPool({
  host: "115.164.213.17",
  user: "root",
  password: "Yfffff123@",
  database: "mydb",
});

export default pool;
