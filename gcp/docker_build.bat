@echo off

set IMAGE_TAG=latest
cd ..
docker build -t npsolve/katzemeo:%IMAGE_TAG% -f gcp/Dockerfile .
cd gcp