@echo off

rem deno run --allow-env --allow-read csvCLI.ts %*

deno run --allow-env --allow-read --allow-run --allow-net --config tsconfig.json index.tsx %*