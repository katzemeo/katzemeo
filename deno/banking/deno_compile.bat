@echo off

deno compile --allow-read csvCLI.ts

rem deno compile --allow-env --allow-read --allow-net --config tsconfig.json index.tsx %*
