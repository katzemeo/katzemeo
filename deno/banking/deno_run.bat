@echo off

rem set ENV_PATH=.env.local
rem deno run --allow-env --allow-read csvParser.ts

deno run --allow-env --allow-read csvCategorize.ts %*