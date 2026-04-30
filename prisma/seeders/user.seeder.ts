import {
  OrganisationRole,
  PrismaClient,
} from '../../src/generated/prisma/client';
import { hashPassword } from '../../src/common/utils';
import { SeededOrganisationIds } from './organisation.seeder';

interface SeedUser {
  name: string;
  surname: string;
  email: string;
  organisations: Array<{
    organisationId: string;
    role: OrganisationRole;
  }>;
}

export async function seedUsers(
  prisma: PrismaClient,
  organisationIds: SeededOrganisationIds,
): Promise<void> {
  const passwordHash = await hashPassword('Admin123!');

  const users: SeedUser[] = [
    {
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@bydeusz.com',
      organisations: [
        { organisationId: organisationIds.bydeusz, role: OrganisationRole.OWNER },
        { organisationId: organisationIds.nike, role: OrganisationRole.MEMBER },
      ],
    },
    {
      name: 'Jane',
      surname: 'Admin',
      email: 'jane.admin@bydeusz.com',
      organisations: [
        { organisationId: organisationIds.bydeusz, role: OrganisationRole.OWNER },
      ],
    },
    {
      name: 'John',
      surname: 'Smith',
      email: 'john.smith@bydeusz.com',
      organisations: [
        { organisationId: organisationIds.bydeusz, role: OrganisationRole.MEMBER },
      ],
    },
    {
      name: 'Anna',
      surname: 'Jansen',
      email: 'anna.jansen@bydeusz.com',
      organisations: [
        { organisationId: organisationIds.bydeusz, role: OrganisationRole.MEMBER },
      ],
    },
    {
      name: 'Tom',
      surname: 'Bakker',
      email: 'tom.bakker@bydeusz.com',
      organisations: [
        { organisationId: organisationIds.bydeusz, role: OrganisationRole.MEMBER },
      ],
    },
    {
      name: 'Lisa',
      surname: 'Visser',
      email: 'lisa.visser@bydeusz.com',
      organisations: [
        { organisationId: organisationIds.nike, role: OrganisationRole.OWNER },
      ],
    },
  ];

  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        surname: user.surname,
        password: passwordHash,
        isActive: true,
      },
      create: {
        name: user.name,
        surname: user.surname,
        email: user.email,
        password: passwordHash,
        isActive: true,
      },
    });

    for (const membership of user.organisations) {
      await prisma.organisationMember.upsert({
        where: {
          userId_organisationId: {
            userId: created.id,
            organisationId: membership.organisationId,
          },
        },
        update: { role: membership.role },
        create: {
          userId: created.id,
          organisationId: membership.organisationId,
          role: membership.role,
        },
      });
    }
  }
}
