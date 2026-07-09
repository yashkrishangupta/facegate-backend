import { Pool } from "pg";

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'facegate_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'mahima_sql',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.connect()
    .then((client) => {
        console.log("✅ PostgreSQL Connected");
        client.release();
    })
    .catch((err) => {
        console.error("Database Connection Error:", err);
    });

export default pool;