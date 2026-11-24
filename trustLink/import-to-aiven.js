import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function importToAiven() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'avnadmin';
  const database = process.env.DB_NAME || 'defaultdb';

  console.log(`⏳ Connecting to: ${host} on port ${port} as ${user}...`);

  // Connect to Aiven over SSL
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password: process.env.DB_PASSWORD,
    database,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
  });

  console.log('✅ Connected to Aiven Cloud MySQL!');

  if (!fs.existsSync('trustlink_db.sql')) {
    console.error('❌ Could not find trustlink_db.sql in your root folder!');
    process.exit(1);
  }

  let sql = fs.readFileSync('trustlink_db.sql', 'utf8');

  // 1. Remove database creation / USE statements so it imports into defaultdb
  sql = sql.replace(/CREATE DATABASE[^\n]+/gi, '-- removed create db');
  sql = sql.replace(/USE `?[a-zA-Z0-9_]+`?;/gi, '-- removed use db');

  // 2. Disable sql_require_primary_key & foreign keys for the import session
  sql = `
    SET SESSION sql_require_primary_key = 0;
    SET FOREIGN_KEY_CHECKS = 0;
  ` + sql;

  console.log('⏳ Uploading tables, relationships, and seed data into Aiven...');
  await connection.query(sql);

  console.log('🎉 SUCCESS! All tables and data are now imported into Aiven Cloud MySQL.');
  await connection.end();
  process.exit(0);
}

importToAiven().catch(err => {
  console.error('❌ Import failed:', err.message);
  process.exit(1);
});
