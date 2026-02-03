import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './config/db.js';
import { connectRedis, redisClient } from './config/redis.js';

const app = express();
const port = 3000;

connectRedis();

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/api", (req, res) => { //.get only responds to HTTP GET requests
    res.send("Hello World!");
});

/* ANTIGUA PRUEBA!
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
*/

app.post("/api/create-user", async (req,res) => {
    
    const { username, password } = req.body;
    
    try {
        const user = await prisma.user.create({
            data: {
                name: username,
                email: 'user1@example.com',
                password: password
            },
        }) 
        console.log("User created: ", user);
        await redisClient.set('user_created', JSON.stringify({
            userId: Number(user.idUser),
            username: user.name
            }));
        res.status(201).send({message: "User created", userId: user.idUser});
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).send({message: "Error creating user"});
    }
});

app.post("/api/auth/register", async (req,res) => {
    //Recogemos la información
    const { username, email, password} = req.body;

    try{
        //Por hacer: Comprobar que el correo!
        //Buscamos en la db si existe el usuario
        const possibleUser = await prisma.user.findMany({
            where: { 
                OR: [{
                    name: String(username), 
                },
                {
                    email: String(email),
                },
            ]}
        });
        console.log(possibleUser.toString());
        if(possibleUser.length != 0)  {
            return res.status(409).send({message: "This user is already registered!"});
        }
        //Encriptamos la contraseña
        const hash = await bcrypt.hash(password, 10);
        //Guardamos el usuario
        const user = await prisma.user.create({
            data: {
                name: username,
                email: email,
                password: hash
            },
        }) 
        res.status(200).send({message: "User created", userId: user.idUser});
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).send({message: "Error creating user"});
    }
});

app.post("/api/auth/login", async (req,res) => {
    //Recogemos la información
    const { email, password} = req.body;

    try{
        //Buscamos en la db si existe el usuario
        const user = await prisma.user.findUnique({
            where: { 
                email: String(email),
            }
        });

        if (user.length == 0) {
            //Por hacer: Comprobar si 409 es el código apropieado!         
            return res.status(401).send({message: "This email is not registered!"});
        }
        //Comprobamos si la contraseña es la correcta
        const match = await bcrypt.compare(password, user.password);
        if(match) {
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET)
            res.setHeader("token", token);
            //Por hacer: Enviar a otra pantalla!
        } else {
            return res.status(401).send({message: "Incorrect Password"})
        }
        console.log("User Logged: ", user);
        res.status(200).send({message: "Successful login!", userId: user.idUser});
    } catch (err) {
        console.error("Error logging in:", err);
        res.status(500).send({message: "Error logging in"});
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});