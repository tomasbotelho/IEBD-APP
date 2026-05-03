const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});
const mysql = require("mysql2");

async function createDBConnection() {
  const config = {
    host: process.env.DB_HOST || process.env.MYSQL_HOST,
    user: process.env.DB_USER || process.env.MYSQL_USER,
    password: process.env.DB_PASS || process.env.MYSQL_PASSWORD,
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE,
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT)
  };

  const db = await mysql
    .createPool(config)
    .promise();

  try {
    await db.query("SELECT 1");
    console.log("Conectado à base de dados com sucesso!");
    return db;
  } catch (err) {
    console.error("Erro ao conectar à base de dados:", err.message);
    throw err;
  }
}

if (require.main === module) {
  (async () => {
    try {
      await createDBConnection();
    } catch (err) {
      console.error(err);
    }
  })();
}

module.exports = createDBConnection;
