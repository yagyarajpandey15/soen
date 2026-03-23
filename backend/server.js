import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 5000;

// 🔥 CRITICAL FIX (MUST BE HERE)
app.set("trust proxy", 1);

const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:5173'];

const server = http.createServer(app);

server.timeout = 90000;
server.keepAliveTimeout = 91000;
server.headersTimeout = 92000;

const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error('Socket origin not allowed'));
        },
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

server.listen(port, () => {
    console.log("Server running on port " + port);
});