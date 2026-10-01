FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY tsup.config.ts ./
COPY src ./src

RUN DATABASE_URL="postgresql://user:password@localhost:5432/db" npx prisma generate
RUN npm run build

FROM node:20-alpine AS production-dependencies

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-alpine AS migrator

WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY prisma ./prisma
COPY prisma.config.ts ./
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=production-dependencies /app/node_modules ./node_modules

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

RUN chown -R node:node /app

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:4000/health || exit 1

CMD ["node", "dist/server.js"]
