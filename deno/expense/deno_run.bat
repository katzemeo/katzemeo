@echo off
REM -- Run Expense application on localhost with specified PORT (auto launch browser if port is 7777)
REM set PORT=7777
deno run --allow-env --allow-net --allow-run --watch index.ts