# MediaFlow - Modern Social Media Content Downloader

MediaFlow is a modern, compliant, and production-ready social media content downloader web application designed using Next.js 14+ (App Router), TypeScript, and Tailwind CSS. It allows users to safely and legally download public, permissioned social media content from **YouTube**, **TikTok**, **Facebook**, and **Instagram** while strictly conforming to platform security policies.

---

## 🚀 Key Architectural Pillars

### 1. Compliance-First Core (No-Bypass Architecture)
MediaFlow does **NOT** bypass login walls, age barriers, paywalls, DRM mechanisms, or private accounts. It validates every target URL and ensures only publicly accessible resources are processed, capture-binding user consent logs ("I confirm that I own this content...") on every task for security audits.

### 2. SSRF Protection & Input Shielding
Advanced server-side filters check domain hostnames and perform DNS lookups to block requests directed at loopback addresses (`127.0.0.1`, `localhost`), local subnet scopes, or cloud metadata endpoints (`169.254.169.254`). Sanitizers scrub command injection hooks and bad-actor payloads.

### 3. Adaptive Development Execution (Dual-Mode Infrastructure)
To guarantee the codebase runs **instantly out-of-the-box** without complex external systems configurations, we built a resilient fallback layer:
* **Database Fallback:** If `DATABASE_URL` is unconfigured, MediaFlow automatically initializes a high-fidelity in-memory Mock Database store simulating full relational query rules.
* **Queue Fallback:** If Redis is offline, MediaFlow launches a background async in-memory job worker loop that increments processing percentages (e.g. 10% ➔ 45% ➔ 80% ➔ 100%) to feed real-time visual progress bars.

---

## 🛠️ Technology Stack
* **Frontend/Backend:** Next.js 14+ (App Router) & TypeScript
* **Styling:** Vanilla CSS, HSL Custom Tokens, Tailwind CSS v4, Glassmorphic Glass-Panels, Glowing Mesh Backgrounds
* **Database:** Prisma ORM, PostgreSQL (With In-Memory Fallback)
* **Job Queue:** BullMQ & IORedis (With Async Fallback Worker)
* **Icons:** Lucide React
* **Localization:** Sinhala + English-Ready Dictionary & Custom State Hook

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configuration Settings
Copy the env example to `.env`:
```bash
cp .env.example .env
```
*(If you do not configure any database or Redis parameters, the app will gracefully launch in fallback mode using local stubs!)*

### 3. Generate Prisma client
```bash
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📡 API Reference Points

* `POST /api/analyze` - Validates URL safety, resolves hostnames (SSRF check), checks rate limits, and extracts public metadata.
* `POST /api/download` - Binds IP consent records, creates a database Job ID, and queues it to BullMQ/Local Loop.
* `GET /api/jobs/[id]` - Returns current progress percentage (0-100) and compiled download streams.
* `GET /api/admin/stats` - Feeds stats, audit graphs, rate limit breaches, and active abuse flags.

---

## 🐳 Docker Deployment
Build and run the container locally:
```bash
docker build -t mediaflow-app .
docker run -p 3000:3000 mediaflow-app
```
