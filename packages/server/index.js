import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './config/db.js';
import { connectRedis, redisClient } from './config/redis.js';
import lobbyRoutes from './src/routes/LobbyRoutes.js';
import userRoutes from './src/routes/UserRoutes.js';
import { authenticateToken } from './middleware.js';

const app = express();
const port = 3000;


connectRedis();

app.use(express.json());
app.use(cors());

app.get("/api", (req, res) => {
    res.send("Hello World!");
});

app.use('/api/lobby', lobbyRoutes);
app.use('/api/auth', userRoutes)


app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});



