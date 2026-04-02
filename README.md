# 💍 יאללה

> מערכת SaaS לניהול חתונה מלא - תקציב, אורחים, WhatsApp, סידורי הושבה, כרטיסי הושבה, מתנות.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vue 3 + Vite + Pinia + Vue Router |
| Backend | Node.js + Fastify |
| Database | MySQL + Prisma ORM |
| Queue | BullMQ + Redis |
| WhatsApp | whatsapp-web.js |
| PDF | Puppeteer |
| Auth | JWT (access + refresh) |

## Structure

```
wedding-app/
├── backend/    # Node.js + Fastify API
├── frontend/   # Vue 3 + Vite
└── docker-compose.yml
```

## Getting Started

```bash
# Clone
git clone https://github.com/wizzo-dev/wedding-app.git
cd wedding-app

# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Environment

Copy `backend/.env.example` → `backend/.env` and fill in the values.

---

Built with ❤️ by wizzo-dev
