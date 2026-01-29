/*
import mariadb from "mariadb";

let createUserQuery = "CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT, username VARCHAR(50) UNIQUE, password VARCHAR(255))";

export const pool = mariadb.createPool({
    host: 'mariadb',
    user: 'user',
    password: 'password',
    database: 'king_and_peasant'
})

export async function connectDB() {
    let conn; 
    try {
        conn = await pool.getConnection();
        await runQuery(conn, createUserQuery);
        console.log("Connected to MariaDB!");
    } catch (err) {
        console.error("Error conectando a MariaDB:", err);
    } finally {
        if (conn) conn.release();

    }
}

async function runQuery(connection, query) {
    try {
        await connection.query(query);
    } catch (err) {
        console.error("Error queryng MariaDB:", err);
    }
}

export default pool;
*/

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

export const prisma = new PrismaClient();

export default prisma;
