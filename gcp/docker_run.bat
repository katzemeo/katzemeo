@echo off

set CONTAINER=katzemeo
set PORT=4000
docker run --name %CONTAINER% -e PORT=%PORT% -p 80:%PORT% -d -t npsolve/katzemeo:latest