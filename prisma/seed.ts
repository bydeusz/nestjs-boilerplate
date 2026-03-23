import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { seedOrganisations } from './seeders/organisation.seeder';
import { seedUsers } from './seeders/user.seeder';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Verwijdert applicatiedata in FK-volle volgorde. Gebruikt naast upserts wanneer je
 * een echte “lege DB + opnieuw vullen”-run wilt.
 *
 * - Standaard (lokaal / test): wissen vóór seed, tenzij `SEED_SKIP_RESET=true`.
 * - `NODE_ENV=production`: nooit wissen, tenzij `SEED_RESET_DATABASE=true` (expliciet).
 * - Volledig schema droppen + migraties: `npm run prisma:reset` (Prisma migrate reset).
 */
function shouldWipeBeforeSeed(): boolean {
  if (process.env.SEED_SKIP_RESET === 'true') {
    return false;
  }
  if (process.env.SEED_RESET_DATABASE === 'true') {
    return true;
  }
  return process.env.NODE_ENV !== 'production';
}

async function wipeApplicationData(client: PrismaClient): Promise<void> {
  await client.file.deleteMany();
  await client.refreshToken.deleteMany();
  await client.activationCode.deleteMany();
  await client.user.deleteMany();
  await client.organisation.deleteMany();
}

async function main() {
  if (shouldWipeBeforeSeed()) {
    console.log('Clearing application data before seed...');
    await wipeApplicationData(prisma);
  }

  console.log('Seeding database...');
  const organisationIds = await seedOrganisations(prisma);
  await seedUsers(prisma, organisationIds);

  console.log('Seeding completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error: unknown) => {
    console.error('Seeding failed:', error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
