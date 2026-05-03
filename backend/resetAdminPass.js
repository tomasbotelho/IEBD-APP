import bcrypt from "bcryptjs";
import { getPool } from "./src/config/db.js";

async function run() {
  const pool = getPool();
  const hash = await bcrypt.hash("Admin@123", 10);
  // Update pass for admin@sportsclub.pt
  await pool.query(`UPDATE login SET Pass_hash = ? WHERE IDlogin = 14`, [hash]);
  console.log("Password for admin@sportsclub.pt updated to Admin@123");
  process.exit(0);
}
run().catch(console.error);
