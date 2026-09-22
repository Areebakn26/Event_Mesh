# ⚡ EventMesh

> **Open-Source Multi-Channel Notification Infrastructure & Event Digest Engine**

EventMesh is a high-throughput, distributed notification engine designed for modern web apps. It combines multi-channel delivery (Email, In-App SSE, Webhooks, SMS), automated provider failover, dynamic workflow pipelines, real-time analytics, and high-frequency event batching (Digests).

---

## ✨ Features

- 🔀 **Visual Workflow Builder**: Define notification flows with step-by-step logic (Email, In-App, Delay, Digest).
- 📦 **Digest & Batching Engine**: Batch high-frequency events (e.g. "10 new likes") into a single timed digest message per user.
- 🛡️ **Automated Provider Failover**: Automatic multi-tier failover (e.g., SendGrid → Resend → SMTP) when primary providers fail.
- 🔔 **In-App Notification Center**: Real-time SSE (Server-Sent Events) live streaming feed with interactive notification bell UI.
- 📝 **Dynamic Handlebars Templates**: Support for HTML/text templates with variable substitution, loops, and conditional blocks.
- 👤 **Subscriber & Preference Management**: Opt-in/opt-out channel controls, subscriber drawers, and a public preference center.
- 🧪 **Interactive Sandbox**: Trigger workflows, preview handlebars templates, and monitor step execution timelines live.
- 📊 **Real-Time Analytics & DLQ**: Dead Letter Queue management for failed deliveries and delivery metrics dashboard.

---

## 🏗️ Architecture Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Aceternity UI, Lucide Icons |
| **Backend API** | Node.js, Express, TypeScript, JWT Auth |
| **Database** | PostgreSQL (Supabase) via Prisma ORM |
| **Queue & Worker** | Redis (Upstash) + BullMQ background queue workers |
| **Streaming** | Server-Sent Events (SSE) for zero-polling real-time updates |

---

## 🚀 Getting Started Locally

### Prerequisites

- **Node.js**: `v18+`
- **PostgreSQL**: Local database or Supabase URL
- **Redis**: Local Redis instance or Upstash connection string

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Areebakn26/Event_Mesh.git
cd Event_Mesh

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create `.env` in `backend/`:

```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/eventmesh?schema=public"
REDIS_URL="redis://127.0.0.1:6379"
JWT_SECRET="your-super-secret-jwt-key"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

Create `.env` in `frontend/`:

```env
VITE_API_URL="http://localhost:5000/api"
```

### 3. Database Migration

```bash
cd backend
npx prisma db push
```

### 4. Run Development Servers

```bash
# Start Backend & Worker
cd backend
npm run dev

# In another terminal, start Frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173` to access the EventMesh Dashboard.

---

## 🌐 Free Cloud Deployment Architecture

EventMesh is optimized to run **100% FREE** on modern serverless cloud providers:

- **Frontend**: [Vercel](https://vercel.com) (Static Vite hosting)
- **Backend API & Worker**: [Render](https://render.com) (Node.js Web Service)
- **Database**: [Supabase](https://supabase.com) (Managed PostgreSQL)
- **Queue & Cache**: [Upstash](https://upstash.com) (Serverless Redis)

---

## 📄 License

MIT License © 2026 EventMesh
