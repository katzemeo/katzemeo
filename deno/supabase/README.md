# katzemeo - deno - Supabase PoC

## URL
Deno Deploy URL https://dash.deno.com/projects/katzemeo

### Domains
- katzemeo.deno.dev

## Git Integration
> katzemeo/katzemeo@main/server.ts

### Source:
https://github.com/katzemeo/katzemeo/blob/main/server.ts

## Run from terminal (server)
- deno run --allow-net=:8000,db.<DB_HOSTNAME>.supabase.co:6543,db.<DB_HOSTNAME>.supabase.co:0 --allow-env --allow-read --watch server.ts

## Run from terminal (client)
- set ENV_PATH=.env.local OR $env:ENV_PATH=".env.local"
- echo %ENV_PATH% or dir env: or $env:ENV_PATH
- deno run --allow-net=:8000 --allow-env --allow-read --watch getTodos.ts