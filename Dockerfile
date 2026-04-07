# ─── Stage 1: Install deps ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

# ─── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept NEXT_PUBLIC_* as build args (baked into client bundle)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_NAME=KongBeng\ Strategist

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client (needs a dummy DATABASE_URL for generate only)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kongbang"
RUN npx prisma generate

RUN npm run build

# ─── Stage 3: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone       ./
COPY --from=builder /app/.next/static           ./.next/static
COPY --from=builder /app/public                 ./public
COPY --from=builder /app/prisma                 ./prisma
COPY --from=builder /app/node_modules/.prisma   ./node_modules/.prisma

# Entrypoint: run prisma db push then start server
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
