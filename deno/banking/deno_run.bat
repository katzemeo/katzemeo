@echo off

rem set ENV_PATH=.env.local
rem deno run --allow-env --allow-read csvParser.ts

rem deno run --allow-env --allow-read csvCLI.ts %*

deno run --allow-env --allow-read --allow-run --allow-net --config tsconfig.json index.tsx %*
rem deno run --allow-env --allow-read --allow-run --allow-net index.tsx %*