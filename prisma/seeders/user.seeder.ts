import { PrismaClient } from '../../src/generated/prisma/client';
import { hashPassword } from '../../src/common/utils';
import { SeededOrganisationIds } from './organisation.seeder';

export async function seedUsers(
  prisma: PrismaClient,
  organisationIds: SeededOrganisationIds,
): Promise<void> {
  const passwordHash = await hashPassword('Admin123!');
  const bydeuszOrganisationId = organisationIds.bydeusz;

  const users: Array<{
    name: string;
    surname: string;
    email: string;
    isAdmin: boolean;
  }> = [
    {
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@bydeusz.com',
      isAdmin: true,
    },
    {
      name: 'Jane',
      surname: 'Admin',
      email: 'jane.admin@bydeusz.com',
      isAdmin: true,
    },
    {
      name: 'John',
      surname: 'Smith',
      email: 'john.smith@bydeusz.com',
      isAdmin: false,
    },
    {
      name: 'Anna',
      surname: 'Jansen',
      email: 'anna.jansen@bydeusz.com',
      isAdmin: false,
    },
    {
      name: 'Tom',
      surname: 'Bakker',
      email: 'tom.bakker@bydeusz.com',
      isAdmin: false,
    },
    {
      name: 'Lisa',
      surname: 'Visser',
      email: 'lisa.visser@bydeusz.com',
      isAdmin: false,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        surname: user.surname,
        password: passwordHash,
        isAdmin: user.isAdmin,
        isActive: true,
        organisations: {
          set: [{ id: bydeuszOrganisationId }],
        },
      },
      create: {
        name: user.name,
        surname: user.surname,
        email: user.email,
        password: passwordHash,
        isAdmin: user.isAdmin,
        isActive: true,
        organisations: {
          connect: [{ id: bydeuszOrganisationId }],
        },
      },
    });
  }
}
