# Multi-stage build for optimal production size

# 1. Dependency installer
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./

# GitHub Token එක Render හරහා Docker build එකට ලබා ගැනීම
# (මෙය yt-dlp ස්ථාපනයේදී එන Rate Limit Error එක වළක්වයි)
ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=$GITHUB_TOKEN

# youtube-dl-exec ස්ථාපනය වන විට Python සෙවීම නතර කිරීම
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

# Downloader එක සඳහා අත්‍යවශ්‍ය Python3 සහ FFmpeg ස්ථාපනය කිරීම
RUN apk add --no-cache python3 ffmpeg

# App එක 'python' කියා සෙවූ විට එය නිවැරදිව 'python3' වෙත යොමු කිරීම
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