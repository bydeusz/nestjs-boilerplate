import { PrismaClient } from '../../src/generated/prisma/client';

export interface SeededOrganisationIds {
  bydeusz: string;
  everon: string;
  acme: string;
}

const organisations: Array<{ id: string; name: string; address: string; postalCode: string; city: string; kvk?: string; vatNumber?: string; iban?: string }> = [
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
  {
    id: '85891fd0-6524-4fef-ab3e-1b6dc0aaf329',
    name: 'Everon Solutions',
    address: 'Stationsplein 45',
    postalCode: '3013AK',
    city: 'Rotterdam',
    kvk: '87654321',
  },
  {
    id: 'b9189c4a-860f-47c8-af6c-c63ff08fbc8d',
    name: 'Acme Logistics',
    address: 'Markt 12',
    postalCode: '5611EC',
    city: 'Eindhoven',
    iban: 'NL66INGB0001234567',
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
    everon: organisations[1].id,
    acme: organisations[2].id,
  };
}
