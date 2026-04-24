const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    await db.query(`
      CREATE TABLE IF NOT EXISTS pppoe_profiles (
        id int(11) NOT NULL AUTO_INCREMENT,
        router_id int(11) NOT NULL,
        profile_name varchar(255) NOT NULL,
        price int(11) DEFAULT 0,
        limit_uptime varchar(50) DEFAULT '',
        validity_days int(11) DEFAULT 0,
        PRIMARY KEY (id),
        UNIQUE KEY unique_router_profile (router_id, profile_name),
        CONSTRAINT fk_profile_router FOREIGN KEY (router_id) REFERENCES routers (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('SQL Executed!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
