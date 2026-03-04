import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DATABASE_TOKEN = 'DATABASE';

export type Database = NodePgDatabase<typeof schema>;

function buildConnectionString(config: ConfigService): string {
  const connectionString = config.get<string>('SUPABASE_DB_URL');
  if (connectionString) {
    return connectionString;
  }

  const host = config.get<string>('DB_HOST') || 'localhost';
  const port = config.get<number>('DB_PORT') || 5432;
  const database = config.get<string>('DB_NAME') || 'chatcommerce';
  const user = config.get<string>('DB_USER') || 'postgres';
  const password = encodeURIComponent(config.get<string>('DB_PASSWORD') || '');

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_TOKEN,
      useFactory: (configService: ConfigService) => {
        const connectionString = buildConnectionString(configService);

        const pool = new Pool({
          connectionString,
        });

        return drizzle(pool, { schema });
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}
