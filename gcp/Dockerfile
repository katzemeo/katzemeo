FROM ubuntu:latest

##################################################
## Deno version
##################################################
ENV DENO_VERSION=1.19.1

RUN apt-get -qq update \
 && apt-get upgrade -y -o Dpkg::Options::="--force-confold" \
 && apt-get -qq install -y ca-certificates unzip curl tzdata --no-install-recommends \
 && curl -fsSL https://github.com/denoland/deno/releases/download/v${DENO_VERSION}/deno-x86_64-unknown-linux-gnu.zip \
    --output deno.zip \
 && unzip deno.zip \
 && rm deno.zip \
 && chmod 777 deno \
 && mv deno /usr/bin/deno \
 && apt-get -qq remove -y ca-certificates unzip \
 && apt-get -y -qq autoremove \
 && apt-get -qq clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN useradd --uid 1993 --user-group deno \
 && mkdir /deno-dir/ \
 && chown deno:deno /deno-dir/

ENV DENO_DIR /deno-dir/

##################################################
## Change timezone
##################################################
ENV TZ=America/Toronto
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
 && echo $TZ > /etc/timezone \
 && dpkg-reconfigure --frontend noninteractive tzdata

##################################################
## Install app/server
##################################################

RUN mkdir -p /opt/katzemeo/website
WORKDIR "/opt/katzemeo/website"

COPY website/ ./

# Compile the app
RUN deno cache --config tsconfig.json index.tsx

##################################################
## Run server
##################################################
EXPOSE 4000
USER deno

ENTRYPOINT ["deno"]
CMD ["run", "--allow-env", "--allow-read", "--allow-net", "--config", "tsconfig.json", "index.tsx"]