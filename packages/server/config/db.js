import mariadb from "mariadb";

const pool = mariadb.createPool({
    host: 'mariadb',
    user: 'user',
    password: 'password',
    database: 'king_and_peasant'
})

export async function connectDB() {
    let conn; 
    try {
        conn = await pool.getConnection();
        console.log("Connected to MariaDB!");
    } catch (err) {
        console.error("Error conectando a MariaDB:", err);
    } finally {
        if (conn) conn.release();
    }
}

export default pool;
