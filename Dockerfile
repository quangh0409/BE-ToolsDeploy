FROM node:18-alpine AS builder
ARG module
RUN npm install -g npm@10.7.0
RUN npm install -g pnpm
WORKDIR /root/ca
COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch

COPY pnpm-workspace.yaml .
COPY packages packages
COPY apps/$module/package.json apps/$module/

RUN pnpm --filter $module^... --offline install
RUN pnpm --filter $module^... build

RUN pnpm --filter $module --offline install
COPY apps/$module apps/$module
RUN pnpm --filter $module build

FROM node:18-alpine AS runner
ARG module
WORKDIR /root/ca
COPY --from=builder /root/ca/package.json .
COPY --from=builder /root/ca/apps/$module apps/$module
COPY --from=builder /root/ca/packages packages
COPY --from=builder /root/ca/node_modules node_modules

ENV module $module
CMD node apps/$module/build/ca.$module.js
RUN wget https://github.com/jwilder/dockerize/releases/download/v0.6.1/dockerize-linux-amd64-v0.6.1.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-v0.6.1.tar.gz \
    && rm dockerize-linux-amd64-v0.6.1.tar.gz
