import express from 'express';
import { connectDB, pool } from './config/db.js';
import { connectRedis, redisClient } from './config/redis.js';

const app = express();
const port = 3000;

connectDB();
connectRedis();

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/api", (req, res) => { //.get only responds to HTTP GET requests
    res.send("Hello World!");
});

app.post("/api/create-user", async (req, res) => {
    const {username, password} = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);
        console.log(result);
        await redisClient.set('user_created', JSON.stringify({userId: Number(result.insertId), username: username}));
        res.status(201).send({message: "User created", userId: result.insertId.toString()});
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).send({message: "Error creating user"}); 
        //Comprobar si esto lo tengo que poner asi con el catch, 
        //console log y status 500
    } finally {
        if (conn) conn.release();
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});