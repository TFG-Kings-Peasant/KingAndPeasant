import express from 'express';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';

const app = express();
const port = 3000;

connectDB();
connectRedis();

app.get("/api", (req, res) => { //.get only responds to HTTP GET requests
    res.send("Hello World!");
});

app.get("/api/data", async (req, res) => {
    
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});