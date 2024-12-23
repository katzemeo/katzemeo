@echo off

set PORT=8080
deno run --allow-net=:8080 --allow-env --allow-read --allow-run index.tsx

#deno compile --allow-net=:8080 --allow-env --allow-read --allow-run index.tsx
#ren website.exe dnf4life.exe
