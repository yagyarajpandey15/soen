# ⚡ CollabAI — AI-Powered Collaborative Code Editor

> A real-time, browser-based collaborative code editor with built-in AI assistance and live code execution — think Replit meets ChatGPT.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18-61DAFB)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

---

## 📸 Screenshots

| Home | Project Editor | AI Chat |
|------|---------------|---------|
| ![Home](https://via.placeholder.com/380x220?text=Home+Screen) | ![Editor](https://via.placeholder.com/380x220?text=Project+Editor) | ![AI](https://via.placeholder.com/380x220?text=AI+Chat) |

---

## 🚀 What is CollabAI?

CollabAI is a full-stack, production-grade collaborative development environment that runs entirely in the browser. Multiple developers can join a project, chat in real time, trigger an AI assistant to generate code, and instantly preview the output — all without leaving the browser tab.

**Key highlights:**
- Type `@ai build a login page` in the chat → AI generates the full project → code runs live in an iframe
- Real-time collaboration via WebSockets — every keystroke and message is synced instantly
- Zero-install code execution powered by WebContainer API (Node.js in the browser)

---

## ✨ Features

### 🤝 Real-Time Collaboration
- Multiple users can join a project simultaneously
- Live chat with WebSocket-powered message sync
- Collaborator management with invite system

### 🤖 AI Code Assistant
- Trigger AI with `@ai <your prompt>` in the project chat
- Dedicated AI Chat panel on the Home screen
- AI generates complete file trees (HTML, CSS, JS, React, Node.js)
- Responses include build commands and start commands
- Powered by OpenAI GPT-4o-mini

### 🖥️ In-Browser Code Execution
- WebContainer API boots a full Node.js environment in the browser
- Automatic dependency installation (`npm install`)
- Smart start command detection (`dev`, `start`, `serve`)
- Live preview rendered in an iframe
- Terminal output streamed in real time
- Supports HTML/CSS/JS and Node.js/React projects

### 📝 Code Editor
- Syntax-highlighted, editable code view
- Multi-file tab support
- Auto-save to database on blur
- File explorer sidebar

### 🔐 Authentication
- JWT-based auth with secure token storage
- Redis-backed token blacklist for logout
- Protected routes with auth guard

### 📁 Project Management
- Create and name projects
- Persistent file tree stored in PostgreSQL
- Project-level collaborator system

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS |
| Real-time | Socket.IO (client + server) |
| Code Execution | WebContainer API (`@webcontainer/api`) |
| Backend | Node.js, Express.js |
| ORM | Prisma |
| Database | PostgreSQL (Neon serverless) |
| Cache / Auth | Redis (token blacklist) |
| AI | OpenAI GPT-4o-mini |
| Auth | JWT (jsonwebtoken) |
| Markdown | markdown-to-jsx |
| Syntax Highlight | highlight.js |

---

## 📁 Folder Structure

```
collabai/
├── backend/
│   ├── controllers/        # Route handlers (user, project, AI)
│   ├── services/           # Business logic (AI, user, project, Redis)
│   ├── models/             # Prisma-backed data access classes
│   ├── routes/             # Express routers
│   ├── middleware/         # JWT auth middleware
│   ├── db/                 # Prisma client singleton
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   ├── migrations/     # Migration history
│   │   └── seed.js         # Test data seeder
│   ├── .env                # Backend environment variables
│   └── server.js           # Entry point (HTTP + Socket.IO)
│
├── frontend/
│   ├── src/
│   │   ├── screens/        # Page components (Home, Project, Login, Register)
│   │   ├── components/     # AIChat, VirtualBoxModal, ErrorBoundary
│   │   ├── config/         # axios, socket, webContainer instances
│   │   ├── context/        # UserContext, AIContext
│   │   ├── routes/         # AppRoutes with auth guards
│   │   ├── auth/           # UserAuth guard component
│   │   └── services/       # Frontend AI service
│   ├── .env                # Frontend environment variables
│   └── vite.config.js
│
└── README.md
```

---

## ⚙️ Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- A [Neon](https://neon.tech) PostgreSQL database
- A [Redis Cloud](https://redis.io/try-free) instance
- An [OpenAI](https://platform.openai.com) API key with credits

---

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/collabai.git
cd collabai
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
# Server
PORT=3000

# Database (Neon PostgreSQL)
DATABASE_URL='postgresql://user:password@host/dbname?sslmode=require'

# JWT
JWT_SECRET=your_jwt_secret_here

# Redis
REDIS_HOST=your-redis-host.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your_redis_password

# OpenAI
OPENAI_API_KEY=sk-proj-your-openai-key-here
```

Run database migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

Optionally seed test data:

```bash
npm run seed
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_AI_KEY=your_gemini_key_if_using_frontend_ai
```

---

## ▶️ Running Locally

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** WebContainer requires specific HTTP headers (`Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy`). These are already configured in `vite.config.js`.

---

## 📖 Usage Guide

### Creating an account
1. Navigate to `/register` and sign up with email + password
2. You'll be redirected to the Home screen

### Creating a project
1. Click **New Project** on the Home screen
2. Enter a project name and click **Create**
3. Click the project card to open the editor

### Using the AI assistant
Inside a project, type in the chat input:

```
@ai build a snake game in HTML/CSS/JS
```

The AI will:
1. Generate a complete file tree
2. Display the code in the editor
3. Automatically open the **WebContainer Sandbox** to run it live

### Running code manually
- Click **Run in Sandbox** to open the full sandbox modal with terminal + preview
- Click **Run Inline** to run in the background with a preview panel on the right

### Collaborating
- Click **Add collaborator** in the project header
- Select users from the list and click **Add Collaborators**
- All collaborators see messages and file changes in real time

### AI Chat (Home screen)
- Click the **AI Chat** button in the header
- Use **Backend** mode (default) for full code generation
- Use **Frontend** mode for quick questions (requires `VITE_GOOGLE_AI_KEY`)

---

## 🌱 Seeded Test Accounts

After running `npm run seed` in the backend:

| Email | Password |
|-------|----------|
| john@example.com | password123 |
| jane@example.com | password456 |
| bob@example.com | password789 |

---


## 🔮 Roadmap

- [ ] Streaming AI responses (token-by-token like ChatGPT)
- [ ] Monaco Editor integration (VS Code-like editing)
- [ ] File/folder tree with nested directory support
- [ ] GitHub OAuth login
- [ ] Export project as ZIP
- [ ] Shared terminal between collaborators
- [ ] Support for Python via Pyodide
- [ ] Deployment to Vercel / Railway with one click
- [ ] AI context awareness (AI reads existing files before generating)
- [ ] Version history / git-like snapshots

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow the existing code style and keep PRs focused on a single feature or fix.

---

## 🐛 Known Issues

- WebContainer requires a Chromium-based browser (Chrome, Edge, Brave). Firefox is not supported.
- Free-tier OpenAI keys have rate limits — upgrade to a paid plan for production use.
- WebContainer cannot run Java, Python, or other non-JS runtimes natively.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- [WebContainer API](https://webcontainers.io/) by StackBlitz
- [Neon](https://neon.tech) for serverless PostgreSQL
- [Prisma](https://prisma.io) for the ORM
- [OpenAI](https://openai.com) for the AI backbone
- [Socket.IO](https://socket.io) for real-time communication

---

<p align="center">Built with ❤️ by developers, for developers.</p>
#   s o e n  
 