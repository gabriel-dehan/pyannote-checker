import 'reflect-metadata';

import dotenv from 'dotenv';
import path from 'path';
import { DataSource } from 'typeorm';

// Don't forget to set NODE_ENV before calling this CLI
dotenv.config({ path: path.resolve(__dirname, './../.env') });

const database = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL as string,
  ssl: process.env.NODE_ENV === 'production' ? true : false,
  synchronize: process.env.NODE_ENV === 'production' ? false : true,
  logging: process.env.NODE_ENV === 'development' ? true : false,
  entities: [path.resolve(__dirname, '../src/entities/*.entity.ts')],
  migrations: [path.resolve(__dirname, '../src/db/migrations/*.ts')],
  subscribers: [],
});

export default database;
