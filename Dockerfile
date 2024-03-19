FROM node:18-alpine AS builder
ARG module
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
