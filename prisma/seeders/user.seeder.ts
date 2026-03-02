import { PrismaClient } from '../../src/generated/prisma/client';
import { hashPassword } from '../../src/common/utils';
import { SeededOrganisationIds } from './organisation.seeder';

export async function seedUsers(
  prisma: PrismaClient,
  organisationIds: SeededOrganisationIds,
): Promise<void> {
  const adminPasswordHash = await hashPassword('AdminPass123!');
  const userPasswordHash = await hashPassword('UserPass123!');

  await prisma.user.upsert({
    where: { email: 'admin@bydeusz.com' },
    update: {
      name: 'Tadeusz',
      surname: 'Admin',
      password: adminPasswordHash,
      isAdmin: true,
      organisationId: organisationIds.bydeusz,
    },
    create: {
      name: 'Tadeusz',
      surname: 'Admin',
      email: 'admin@bydeusz.com',
      password: adminPasswordHash,
      isAdmin: true,
      organisationId: organisationIds.bydeusz,
    },
  });

  await prisma.user.upsert({
    where: { email: 'jane.doe@everon.com' },
    update: {
      name: 'Jane',
      surname: 'Doe',
      password: userPasswordHash,
      isAdmin: false,
      organisationId: organisationIds.everon,
    },
    create: {
      name: 'Jane',
      surname: 'Doe',
      email: 'jane.doe@everon.com',
      password: userPasswordHash,
      isAdmin: false,
      organisationId: organisationIds.everon,
    },
  });

  await prisma.user.upsert({
    where: { email: 'john.smith@acme.com' },
    update: {
      name: 'John',
      surname: 'Smith',
      password: userPasswordHash,
      isAdmin: false,
      organisationId: organisationIds.acme,
    },
    create: {
      name: 'John',
      surname: 'Smith',
      email: 'john.smith@acme.com',
      password: userPasswordHash,
      isAdmin: false,
      organisationId: organisationIds.acme,
    },
  });
}
