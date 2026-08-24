import mysql from "mysql2/promise";
import { RowDataPacket } from "mysql2";

const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

interface VersionRow extends RowDataPacket {
  version: string;
}

export interface DatabaseStatus {
  ok: boolean;
  host: string;
  port: number;
  database: string;
  user: string;
  version?: string;
  latencyMs: number;
  error?: string;
}

// Pings the pool and reports back instead of throwing, so the startup banner
// can print a failure without taking the whole server down with it.
export async function checkDatabase(): Promise<DatabaseStatus> {
  const startedAt = Date.now();

  const status: DatabaseStatus = {
    ok: false,
    host: process.env.DB_HOST ?? "(unset)",
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME ?? "(unset)",
    user: process.env.DB_USER ?? "(unset)",
    latencyMs: 0,
  };

  try {
    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query<VersionRow[]>(
        `SELECT VERSION() AS version`,
      );

      status.ok = true;
      status.version = rows[0]?.version;
    } finally {
      connection.release();
    }
  } catch (error) {
    status.error = error instanceof Error ? error.message : String(error);
  }

  status.latencyMs = Date.now() - startedAt;

  return status;
}

export async function connectDB(): Promise<void> {
  const status = await checkDatabase();

  if (!status.ok) {
    console.error("❌ Database Connection Failed:", status.error);

    throw new Error(status.error ?? "Database connection failed");
  }

  console.log("✅ Database Connected");
}

export default pool;
