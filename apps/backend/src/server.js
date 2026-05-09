import cors from "cors";
import express from "express";
import pg from "pg";

const app = express();
const port = Number(process.env.PORT || 3000);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const pool = new pg.Pool({
  connectionString: databaseUrl
});

app.use(cors());
app.use(express.json());

async function ensureSchema() {
  await pool.query(`
    create table if not exists visits (
      id bigserial primary key,
      created_at timestamptz not null default now()
    )
  `);
}

async function waitForDatabase() {
  const maxAttempts = Number(process.env.DB_CONNECT_ATTEMPTS || 30);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await ensureSchema();
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      console.log(`database not ready, retrying (${attempt}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

app.get("/healthz", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/status", async (_req, res) => {
  const result = await pool.query("select count(*)::int as visits from visits");
  res.json({
    service: "backend",
    database: "postgres",
    visits: result.rows[0].visits,
    timestamp: new Date().toISOString()
  });
});

app.post("/api/visits", async (_req, res) => {
  const result = await pool.query("insert into visits default values returning id, created_at");
  res.status(201).json(result.rows[0]);
});

await waitForDatabase();

app.listen(port, "0.0.0.0", () => {
  console.log(`backend listening on ${port}`);
});
