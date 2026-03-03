import { PrismaClient } from '../../src/generated/prisma/client';
import { hashPassword } from '../../src/common/utils';
import { SeededOrganisationIds } from './organisation.seeder';

export async function seedUsers(
  prisma: PrismaClient,
  organisationIds: SeededOrganisationIds,
): Promise<void> {
  const adminPasswordHash = await hashPassword('Admin123!');
  const userPasswordHash = await hashPassword('User123!');
  const bydeuszOrganisationId = organisationIds.bydeusz;

  await prisma.user.upsert({
    where: { email: 'john.doe@bydeusz.com' },
    update: {
      name: 'john',
      surname: 'doe',
      password: adminPasswordHash,
      isAdmin: true,
      organisation: {
        connect: { id: bydeuszOrganisationId },
      },
    },
    create: {
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@bydeusz.com',
      password: adminPasswordHash,
      isAdmin: true,
      organisation: {
        connect: { id: bydeuszOrganisationId },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'john.smith@bydeusz.com' },
    update: {
      name: 'John',
      surname: 'Smith',
      password: userPasswordHash,
      isAdmin: false,
      organisation: {
        connect: { id: bydeuszOrganisationId },
      },
    },
    create: {
      name: 'John',
      surname: 'Smith',
      email: 'john.smith@bydeusz.com',
      password: userPasswordHash,
      isAdmin: false,
      organisation: {
        connect: { id: bydeuszOrganisationId },
      },
    },
  });
}
