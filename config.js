require('dotenv').config();

// require postgres
const { Pool } = require('pg');

// check if node is set to production, not dev
const isProduction = process.env.NODE_ENV === 'production';

const connectionString = 
`postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
  ssl: isProduction
});

module.exports = { pool };