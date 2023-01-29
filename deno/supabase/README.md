# katzemeo - deno - Supabase PoC

Proof of concept using Supabase (Postgres database) with Deno to build a simple Todo server and HTTP client to access the API.

## URL
Deno Deploy URL https://dash.deno.com/projects/katzemeo

### Domains
- katzemeo.deno.dev

## Git Integration
> katzemeo/katzemeo@main/server.ts

### Source:
https://github.com/katzemeo/katzemeo/blob/main/server.ts

## Run from terminal (server)
```
cd deno/supabase

Setup local .env file and start the server
- set ENV_PATH=.env.local OR $env:ENV_PATH=".env.local"
- echo %ENV_PATH% or dir env: or $env:ENV_PATH

Replace with the required DB host / port (port 0 is needed if DB_CERT not configured)
- deno run --allow-net=:8000,db.<DB_HOSTNAME>.supabase.co:6543,db.<DB_HOSTNAME>.supabase.co:0 --allow-env --allow-read --watch server.ts
OR
- deno run --allow-net=:8000,db.<DB_HOSTNAME>.supabase.co:6543 --allow-env --allow-read --watch server.ts
```

## Run from terminal (client)
Run the client to access the server
```
cd deno/supabase

- deno run --allow-net=:8000 --allow-env --allow-read --watch getTodos.ts
OR
- deno run --allow-net=katzemeo.deno.dev:80 --allow-env --allow-read --watch getTodos.ts
```