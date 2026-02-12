import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './config/db.js';
import { connectRedis, redisClient } from './config/redis.js';
import lobbyRoutes from './src/routes/LobbyRoutes.js';
import userRoutes from './src/routes/UserRoutes.js';
import friendshipRoutes from './src/routes/FriendshipRoutes.js';
import { authenticateToken } from './middleware.js';
import { Server } from 'socket.io';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const io = new Server(server,{
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const port = 3000;
const userSockets= new Map();

connectRedis();

app.use(express.json());
app.use(cors());

app.get("/api", (req, res) => {
    res.send("Hello World!");
});

app.use('/api/lobby', lobbyRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/friendship', friendshipRoutes);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('register', (userId) => {
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} registered with socket ID: ${socket.id}`);
    });

    socket.on('disconnect', () => {
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                break;
            }
        }
        console.log('A user disconnected:', socket.id);
    });
});

server.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});

export { io, userSockets };


