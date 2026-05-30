# Multi-stage build for optimal production size

# 1. Dependency installer
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Tell youtube-dl-exec to skip Python check during npm install
ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1
RUN npm ci

# 2. Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client and build the application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npx prisma generate || true
RUN npm run build

# 3. Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Install Python3 and FFmpeg required for the downloader
RUN apk add --no-cache python3 ffmpeg
# Create a symlink so the 'python' command points to 'python3' correctly
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Setup non-root execution for container safety
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]