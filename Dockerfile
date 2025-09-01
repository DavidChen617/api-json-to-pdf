FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@10.15.0

COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

RUN pnpm install --frozen-lockfile

COPY src/ ./src/

RUN pnpm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN npm install -g pnpm@10.15.0

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod && pnpm store prune

COPY --from=builder /app/dist ./dist

COPY src/fonts ./src/fonts

RUN mkdir -p /app/input /app/output

RUN chown -R node:node /app
USER node

VOLUME ["/app/input", "/app/output"]

ENTRYPOINT ["node", "dist/index.js"]
