import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedReferenceData() {
  const password = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@assemblyflow.com' },
    update: {},
    create: {
      email: 'admin@assemblyflow.com',
      password,
      name: 'Business Owner',
    },
  });

  const storageLocations = [
    { name: 'BH Storage', code: 'BH', description: 'Main BH warehouse storage' },
    { name: 'Camden Storage', code: 'CAMDEN', description: 'Camden storage facility' },
    { name: 'Site Storage', code: 'SITE', description: 'Doors at customer sites' },
    { name: 'Container Storage', code: 'CONTAINER', description: 'Container storage area' },
    { name: 'Study Storage', code: 'STUDY', description: 'Study storage location' },
  ];

  for (const loc of storageLocations) {
    await prisma.storageLocation.upsert({
      where: { code: loc.code },
      update: {},
      create: loc,
    });
  }

  const returnReasons = [
    { name: 'Re-Hanging', code: 'RE_HANGING' },
    { name: 'Re-Fixing', code: 'RE_FIXING' },
    { name: 'Damage', code: 'DAMAGE' },
    { name: 'Cancellation', code: 'CANCELLATION' },
    { name: 'Customer Change', code: 'CUSTOMER_CHANGE' },
    { name: 'Wrong Delivery', code: 'WRONG_DELIVERY' },
    { name: 'Site Issue', code: 'SITE_ISSUE' },
    { name: 'Other', code: 'OTHER' },
  ];

  for (const reason of returnReasons) {
    await prisma.returnReason.upsert({
      where: { code: reason.code },
      update: {},
      create: reason,
    });
  }
}

async function main() {
  console.log('Seeding reference data only (no demo records)...');
  await seedReferenceData();
  console.log('Done. Login: admin@assemblyflow.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
