#!/bin/sh

# Note: if behind a proxy, make sure to set the appropriate HTTP_PROXY, HTTPS_PROXY, env variables etc.
# In addition, if you encounter certificate errors, specify the --cert <CA_CERT.PEM> to resolve unknown cert errors.
# As a last resort, you can temporarily specify --unsafely-ignore-certificate-errors to download & cache resources.

deno run --allow-env --allow-read csvCLI.ts "$@"