import { PrismaClient } from '../../src/generated/prisma/client';

export interface SeededOrganisationIds {
  bydeusz: string;
}

const organisations: Array<{
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  kvk?: string;
  vatNumber?: string;
  iban?: string;
}> = [
  {
    id: '95ea1d7c-9552-4ea8-9d17-bf305f1246b6',
    name: 'Bydeusz B.V.',
    address: 'Keizersgracht 101',
    postalCode: '1015CJ',
    city: 'Amsterdam',
    kvk: '12345678',
    vatNumber: 'NL123456789B01',
    iban: 'NL91ABNA0417164300',
  },
];

export async function seedOrganisations(
  prisma: PrismaClient,
): Promise<SeededOrganisationIds> {
  for (const organisation of organisations) {
    await prisma.organisation.upsert({
      where: { id: organisation.id },
      update: {
        ...organisation,
      },
      create: {
        ...organisation,
      },
    });
  }

  return {
    bydeusz: organisations[0].id,
  };
}
