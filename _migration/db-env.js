const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ENV_CANDIDATES = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', 'implementations', 'AuthMembership', 'backend-api_Module1', '.env'),
  path.join(__dirname, '..', 'implementations', 'course-service', '.env'),
  path.join(__dirname, '..', 'implementations', 'payment-service', '.env'),
  path.join(__dirname, '..', 'implementations', 'reservation-service', 'backend', '.env'),
];

function displayPath(filePath) {
  return path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
}

function loadDatabaseEnv() {
  if (process.env.DATABASE_URL) {
    return { source: 'process environment' };
  }

  for (const filePath of ENV_CANDIDATES) {
    if (!fs.existsSync(filePath)) continue;

    dotenv.config({ path: filePath });
    if (process.env.DATABASE_URL) {
      return { source: displayPath(filePath) };
    }
  }

  return { source: null };
}

function requireDatabaseUrl() {
  const { source } = loadDatabaseEnv();
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Add it to _migration/.env or one of the service .env files before running database commands.'
    );
  }
  return { databaseUrl: process.env.DATABASE_URL, source };
}

module.exports = { loadDatabaseEnv, requireDatabaseUrl };
