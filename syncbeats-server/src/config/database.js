const knex = require('knex');
const env = require('./env');
const logger = require('../utils/logger');

const knexConfig = {
  client: 'pg',
  connection: env.DATABASE_URL || {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME
  },
  pool: {
    min: 2,
    max: 10
  }
};

const db = knex(knexConfig);

// Verify DB connection
db.raw('SELECT 1')
  .then(() => {
    logger.info('Database connection established successfully.');
  })
  .catch((err) => {
    logger.error('Database connection failed. Continuing without database sync: %O', err);
  });

module.exports = db;
