@echo off
REM -- Run ROI application on localhost with specified PORT (auto launch browser if port is 7777)
REM set API_URL=https://api.npsolve.com
REM set API_KEY=CHANGE ME!!
REM set PORT=7777
set API_URL=http://localhost/cashflow
deno run --allow-env --allow-net --allow-run --watch index.ts