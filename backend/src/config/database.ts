import { Sequelize } from 'sequelize';
import { env } from './env';

const isCloudDb =
  env.NODE_ENV === 'production' ||
  env.DATABASE_URL.includes('neon.tech') ||
  env.DATABASE_URL.includes('supabase') ||
  env.DATABASE_URL.includes('sslmode=require');

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: isCloudDb
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
  logging: env.NODE_ENV === 'production' ? false : console.log,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
