import mysql from "mysql2/promise";
import { env } from "./env.js";

let pool;

export const getPool = () => {
  if (env.useFakeDb) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool({
      host: env.mysql.host,
      port: env.mysql.port,
      database: env.mysql.database,
      user: env.mysql.user,
      password: env.mysql.password,
      charset: "utf8mb4",
      connectionLimit: 10,
      namedPlaceholders: true
    });
  }

  return pool;
};
