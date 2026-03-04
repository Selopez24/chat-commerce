import { defineConfig } from 'drizzle-kit';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 5432;
const database = process.env.DB_NAME || 'chatcommerce';
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || '';

const connectionString = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

export default defineConfig({
  schema: './src/common/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: true,
});
