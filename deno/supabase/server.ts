import { serve } from "https://deno.land/std@0.114.0/http/server.ts";
import * as postgres from "https://deno.land/x/postgres@v0.14.2/mod.ts";
import { loadEnv } from "./env.ts";

const env: any = await loadEnv();

// Code based on: https://deno.com/deploy/docs/tutorial-postgres

// Create a database pool with three connections that are lazily established
//const databaseUrl = env.DATABASE_URL;
//const pool = new postgres.Pool(databaseUrl, 3, true);

// Create a database pool and specify CA cert for TLS connection
const POOL_CONNECTIONS = 3;
const pool = new postgres.Pool({
  database: env.DB_NAME,
  hostname: env.DB_HOST,
  password: env.DB_PASSWORD,
  port: env.DB_PORT,
  user: env.DB_USER,
  tls: {
    caCertificates: [
      await Deno.readTextFile(
        new URL("./prod-ca-2021.crt", import.meta.url),
      ),
    ],
    enabled: false,
  },
}, POOL_CONNECTIONS);

const connection = await pool.connect();
try {
  await connection.queryObject`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL
    )
  `;
} finally {
  connection.release();
}

serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname !== "/todos") {
    return new Response("Not Found", { status: 404 });
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
