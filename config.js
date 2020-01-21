require('dotenv').config();

function getConnectionString() {
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATABASE_URL;
  } else if (process.env.NODE_ENV === 'test') {
    return `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.TEST_DB}`;
  } else {
    return `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DEV_DB}`;
  }
}

// require postgres
const { Pool } = require('pg');

// check if node is set to production, not dev
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: getConnectionString(),
  ssl: isProduction
});

module.exports = { pool };