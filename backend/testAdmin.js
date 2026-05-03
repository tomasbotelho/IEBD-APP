import { getPool } from "./src/config/db.js";
import { env } from "./src/config/env.js";

async function run() {
  const pool = getPool();
  const [logins] = await pool.query(`SELECT IDlogin, username, IDtipoUser, Pass_hash FROM login WHERE IDtipoUser = 1`);
  console.log("Admin Logins:", logins);
  process.exit(0);
}
run().catch(console.error);
