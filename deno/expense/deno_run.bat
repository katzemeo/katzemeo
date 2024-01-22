@echo off
REM -- Run Expense application on localhost with specified PORT (auto launch browser if port is 7777)
REM set PORT=7777
set PROFILE=student
set API_URL=http://localhost:8000/change_me
set API_KEY="<CHANGE ME!>"
deno run --allow-env --allow-net --allow-run --watch index.ts
