import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { TotpEnrollment } from './auth/totp-enrollment.entity.js';
import { TotpLoginChallenge } from './auth/totp-login-challenge.entity.js';
import { TotpRecoveryCode } from './auth/totp-recovery-code.entity.js';




import { Handshake } from './handshake/entities/handshake.entity.js';
import { Review } from './reviews/entities/review.entity.js';
import { Message } from './chat/entities/message.entity.js';
import { Conversation } from './chat/entities/conversation.entity.js';
import { InterestRequest } from './chat/entities/interest-request.entity.js';


import { RegistrationSession } from './auth/registration-session-entity.js';
import { User } from './auth/user.entity.js';
import { Listing } from './listings/listing.entity.js';
import { RoommatePost } from './roommates/roommate-post.entity.js';
import { EmailChangeChallenge } from './auth/email-change-challenge.entity.js';
config({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
});

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
  RegistrationSession,
  User,
  Listing,
  RoommatePost,
  Handshake,
  Review,
  Message,
  Conversation,
  InterestRequest,
  EmailChangeChallenge,
  TotpEnrollment,
  TotpLoginChallenge,
  TotpRecoveryCode,
],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

export default dataSource;