@echo off

set PORT=80
deno run --allow-net=:80 --allow-env --allow-read index.tsx
