import { loadEnv } from "./env.ts";
import { postgres } from "./deps.ts";
import { serve } from "./deps.ts";

const env: any = await loadEnv();

// Code based on: https://deno.com/deploy/docs/tutorial-postgres

// Create a database pool with three connections that are lazily established
//const databaseUrl = env.DATABASE_URL;
//const pool = new postgres.Pool(databaseUrl, 3, true);

// Create a database pool and specify CA cert for TLS connection
const POOL_CONNECTIONS = 3;
const POOL_OPTIONS:any = {
  database: env.DB_NAME,
  hostname: env.DB_HOST,
  password: env.DB_PASSWORD,
  port: env.DB_PORT,
  user: env.DB_USER,
};

// Configure TLS/SSL connection if DB cert is specified (otherwise both ports 0 and DB_PORT must be allowed)
if (env.DB_CERT_FILE || env.DB_CERT) {
  let cert = env.DB_CERT;
  if (env.DB_CERT_FILE) {
    console.debug(`Loading DB cert: ${env.DB_CERT_FILE}`);
    cert = await Deno.readTextFile(
      new URL(env.DB_CERT_FILE, import.meta.url),
    );
  }

  POOL_OPTIONS.tls = {
    caCertificates: [ cert ],
    enabled: false,
  };
}

console.debug("Creating to DB pool and preparing schema...");
//console.debug(POOL_OPTIONS);
const pool = new postgres.Pool(POOL_OPTIONS, POOL_CONNECTIONS);
const connection = await pool.connect();
try {
  await connection.queryObject`
    --DROP TABLE todos;
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL
    );

    --DROP TABLE IF EXISTS symbol_overview;
    --DROP TABLE IF EXISTS symbol_daily;
    --DROP TABLE IF EXISTS symbol;

    CREATE TABLE IF NOT EXISTS symbol (
      id SERIAL PRIMARY KEY,
      code VARCHAR(10) NOT NULL UNIQUE,
      currency VARCHAR(3) NOT NULL,
      exchange VARCHAR(6) NOT NULL,
      last_price NUMERIC(12, 4),
      last_volume NUMERIC,
      last_date TIMESTAMPTZ,
      prev_close NUMERIC(12, 4),
      quote_date TIMESTAMPTZ,
      action VARCHAR(6),
      note VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS symbol_daily (
      id SERIAL PRIMARY KEY,
      symbol_id INTEGER REFERENCES symbol(id) NOT NULL,
      date TIMESTAMPTZ NOT NULL,
      open NUMERIC(12, 4) NOT NULL,
      high NUMERIC(12, 4) NOT NULL,
      low NUMERIC(12, 4) NOT NULL,
      close NUMERIC(12, 4) NOT NULL,
      volume INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS symbol_daily_date_idx ON symbol_daily (symbol_id, date);
  `;
} finally {
  connection.release();
}

serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname !== "/todos") {
    return new Response("Not Found", { status: 404 });
  }

  // Check API key (if configured)
  const apiKey = req.headers.get("X-API-KEY");
  if (env.API_KEY && apiKey !== env.API_KEY) {
    return new Response("Invalid/Missing X-API-KEY Header", { status: 401 });
  }

  const connection = await pool.connect();
  try {
    switch (req.method) {
      case "GET": {
        const result = await connection.queryObject`
          SELECT * FROM todos
        `;
        const body = JSON.stringify(result.rows, null, 2);
        return new Response(body, {
          headers: { "content-type": "application/json" },
        });
      }
      case "POST": {
        // Parse the request body as JSON. If the request body fails to parse,
        // is not a string, or is longer than 256 chars, return a 400 response.
        const todo = await req.json().catch(() => null);
        console.log(todo);
        if (typeof todo.title !== "string" || todo.title.length > 256) {
          return new Response("Bad Request", { status: 400 });
        }

       await connection.queryObject`
          INSERT INTO todos (title) VALUES (${todo.title})
        `;
        return new Response("", { status: 201 });
      }
      default:
        return new Response("Method Not Allowed", { status: 405 });
    }
  } catch (err) {
    console.error(err);
    return new Response(`Internal Server Error\n\n${err.message}`, {
      status: 500,
    });
  } finally {
    connection.release();
  }
});
