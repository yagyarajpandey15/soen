import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

connect();

const app = express();

console.log("NEW CODE RUNNING 🚀");


app.use(cors({
    origin: [
        "https://soen-ho34e96zk-yagyarajpandey99-4607s-projects.vercel.app",
        "https://soen-green.vercel.app",
        "http://localhost:5173"
    ],
    credentials: true
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'CollabAI API is running' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

export default app;