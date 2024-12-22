#!/bin/sh

export PORT=80
#deno run --allow-net=:80 --allow-env --allow-read --allow-run index.tsx
deno compile --allow-net=:80 --allow-env --allow-read --allow-run index.tsx