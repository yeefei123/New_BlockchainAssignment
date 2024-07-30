import { createPool } from "mysql2/promise";

const pool = createPool({
  host: "localhost",
  user: "root",
  password: "Yfffff123@",
  database: "mydb",
});

export default pool;
