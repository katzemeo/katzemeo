@echo off

rem deno run --allow-import=unpkg.com,jsr.io --allow-env --allow-read csvCLI.ts %*

deno run --allow-import --allow-env --allow-read --allow-run --allow-net --config tsconfig.json --watch index.tsx %*