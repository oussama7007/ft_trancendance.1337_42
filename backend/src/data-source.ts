
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

config({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
});
import { DataSource } from 'typeorm';
import { RegistrationSession } from './auth/registration-session-entity.js';
import { User } from './auth/user.entity.js';

import { Listing } from './listings/listing.entity.js';



export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: [RegistrationSession, User, Listing],

  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});