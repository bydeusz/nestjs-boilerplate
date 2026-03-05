import { PrismaClient } from '../../src/generated/prisma/client';
import { hashPassword } from '../../src/common/utils';
import { SeededOrganisationIds } from './organisation.seeder';

export async function seedUsers(
  prisma: PrismaClient,
  organisationIds: SeededOrganisationIds,
): Promise<void> {
  const PasswordHash = await hashPassword('Admin123!');
  const bydeuszOrganisationId = organisationIds.bydeusz;

  await prisma.user.upsert({
    where: { email: 'john.doe@bydeusz.com' },
    update: {
      name: 'john',
      surname: 'doe',
      password: PasswordHash,
      isAdmin: true,
      isActive: true,
      organisations: {
        set: [{ id: bydeuszOrganisationId }],
      },
    },
    create: {
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@bydeusz.com',
      password: PasswordHash,
      isAdmin: true,
      isActive: true,
      organisations: {
        connect: [{ id: bydeuszOrganisationId }],
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'john.smith@bydeusz.com' },
    update: {
      name: 'John',
      surname: 'Smith',
      password: PasswordHash,
      isAdmin: false,
      isActive: true,
      organisations: {
        set: [{ id: bydeuszOrganisationId }],
      },
    },
    create: {
      name: 'John',
      surname: 'Smith',
      email: 'john.smith@bydeusz.com',
      password: PasswordHash,
      isAdmin: false,
      isActive: true,
      organisations: {
        connect: [{ id: bydeuszOrganisationId }],
      },
    },
  });
}
