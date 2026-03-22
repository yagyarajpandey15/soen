import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 3000;



const server = http.createServer(app);
// Increase server timeout to 90s to support long AI responses
server.timeout = 90000;
server.keepAliveTimeout = 91000;
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});


io.use(async (socket, next) => {

    try {

        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[ 1 ];
        const projectId = socket.handshake.query.projectId;

        socket.project = await projectModel.findById(projectId);
        
        if (!socket.project) {
            return next(new Error('Project not found'));
        }


        if (!token) {
            return next(new Error('Authentication error'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Authentication error'))
        }


        socket.user = decoded;

        next();

    } catch (error) {
        next(error)
    }

})


io.on('connection', socket => {
    socket.roomId = socket.project.id


    console.log('a user connected');



    socket.join(socket.roomId);

    socket.on('project-message', async data => {

        const message = data.message;

        const aiIsPresentInMessage = typeof message === 'string' && message.includes('@ai');
        socket.broadcast.to(socket.roomId).emit('project-message', data)

        if (aiIsPresentInMessage) {

            // Robustly extract the prompt after @ai
            const prompt = (typeof message === 'string' ? message : String(message ?? ''))
                .replace(/@ai\s*/i, '')
                .trim();

            if (!prompt) {
                io.to(socket.roomId).emit('project-message', {
                    message: JSON.stringify({
                        text: 'Please include details after @ai, e.g., "@ai create a React button".',
                        error: true
                    }),
                    sender: { _id: 'ai', email: 'AI' }
                });
                return;
            }

            const result = await generateResult(prompt);


            io.to(socket.roomId).emit('project-message', {
                message: result,
                sender: {
                    _id: 'ai',
                    email: 'AI'
                }
            })


            return
        }


    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.leave(socket.roomId)
    });
});




server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})