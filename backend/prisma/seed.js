import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDocumentPng } from './seedDocumentImages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

const DEMO_ASSEMBLY_JOBS = [
  '44.10001', '44.10002', '44.10003', '44.10004',
  '44.10005', '44.10006', '44.10007',
];

const DEMO_READY_JOBS = [
  '44.20001', '44.20002', '44.20003', '44.20004',
  '44.20005', '44.20006', '44.20007',
];

const ALL_DEMO_JOBS = [...DEMO_ASSEMBLY_JOBS, ...DEMO_READY_JOBS];

const CELL_LIGHTS = ['Green', 'Red', 'Amber', 'Blue', 'White', 'Yellow', 'Orange'];
const LOCK_TYPES = ['SASH_LOCK', 'MORTICE_LOCK', 'DEAD_LOCK', 'SASH_LOCK', 'MORTICE_LOCK', 'DEAD_LOCK', 'SASH_LOCK'];
const LEAF_TYPES = ['SINGLE_LEAF', 'DOUBLE_LEAF', 'SINGLE_LEAF', 'DOUBLE_LEAF', 'SINGLE_LEAF', 'DOUBLE_LEAF', 'SINGLE_LEAF'];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d;
}

async function cleanupDemoData() {
  await prisma.assembly.deleteMany({ where: { jobNumber: { in: DEMO_ASSEMBLY_JOBS } } });
  await prisma.readyForAssembly.deleteMany({ where: { jobNumber: { in: ALL_DEMO_JOBS } } });
  await prisma.movementHistory.deleteMany({ where: { jobNumber: { in: DEMO_ASSEMBLY_JOBS } } });
  await prisma.readyForAssembly.deleteMany({
    where: { jobNumber: { startsWith: '44.000' } },
  });

  const seedUploadDir = path.join(__dirname, '../uploads/fips/seed');
  if (fs.existsSync(seedUploadDir)) {
    fs.rmSync(seedUploadDir, { recursive: true, force: true });
  }
}

async function seedReferenceData() {
  const password = await bcrypt.hash('admin123', 12);
  const user = await prisma.user.upsert({
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

  const sites = [
    { name: 'Camden Project', address: 'Camden High Street, London' },
    { name: 'Greenwich Site', address: 'Greenwich Peninsula, London' },
    { name: 'Birmingham Tower', address: 'Broad Street, Birmingham' },
    { name: 'Manchester Central', address: 'Deansgate, Manchester' },
    { name: 'Leeds Riverside', address: 'The Calls, Leeds' },
    { name: 'Bristol Harbour', address: 'Harbourside, Bristol' },
    { name: 'Edinburgh Old Town', address: 'Royal Mile, Edinburgh' },
  ];

  for (const site of sites) {
    await prisma.site.upsert({
      where: { name: site.name },
      update: { address: site.address },
      create: site,
    });
  }

  return user;
}

async function createReadyComponents(jobNumber, serialNumber, readyDate, cellLight, isAssembled) {
  const base = { jobNumber, serialNumber, cellLight, readyDate, isAssembled };
  const leaf = await prisma.readyForAssembly.create({
    data: {
      ...base,
      sl: `SL-${serialNumber}`,
      sl1: `SL1-${serialNumber}`,
      componentType: 'DOOR_LEAF',
    },
  });
  const frame = await prisma.readyForAssembly.create({
    data: {
      ...base,
      sl: `SL-${serialNumber}`,
      sl1: `SL1-${serialNumber}`,
      componentType: 'DOOR_FRAME',
    },
  });
  return { leaf, frame };
}

async function logEvents(assemblyId, jobNumber, serialNumber, events) {
  for (const event of events) {
    await prisma.movementHistory.create({
      data: {
        assemblyId,
        jobNumber,
        serialNumber,
        eventType: event.type,
        details: event.details,
        eventDate: event.date,
      },
    });
  }
}

async function seedAssemblyWorkflow({
  index,
  jobNumber,
  serialNumber,
  userId,
  locations,
  sites,
  returnReasons,
  config,
}) {
  const readyDate = daysAgo(14 - index);
  const assemblyDate = daysAgo(12 - index);
  const { leaf, frame } = await createReadyComponents(
    jobNumber,
    serialNumber,
    readyDate,
    CELL_LIGHTS[index],
    true,
  );

  const assembly = await prisma.assembly.create({
    data: {
      jobNumber,
      serialNumber,
      lockType: LOCK_TYPES[index],
      leafType: LEAF_TYPES[index],
      assemblyDate,
      assemblyStatus: 'COMPLETED',
      currentLocationId: config.locationId || null,
      currentSiteId: config.siteId || null,
      components: {
        create: [
          { readyForAssemblyId: leaf.id },
          { readyForAssemblyId: frame.id },
        ],
      },
      barcode: {
        create: {
          barcodeValue: `AF-${jobNumber.replace('.', '')}-${serialNumber}`,
          generatedAt: daysAgo(11 - index),
        },
      },
      fipsForm: {
        create: {
          jobNumber,
          serialNumber,
          status: config.fipsStatus,
          submittedDate: config.fipsStatus !== 'PENDING' ? daysAgo(10 - index) : null,
        },
      },
      qualityCheck: {
        create: {
          jobNumber,
          serialNumber,
          status: config.qcStatus,
          qcDate: config.qcStatus === 'CHECKED' ? daysAgo(9 - index) : null,
          remarks: config.qcStatus === 'REJECTED' ? 'Surface defect found' : null,
        },
      },
    },
    include: {
      barcode: true,
      fipsForm: true,
      qualityCheck: true,
    },
  });

  const events = [
    { type: 'READY_FOR_ASSEMBLY', details: 'Components marked ready', date: readyDate },
    { type: 'ASSEMBLY_COMPLETED', details: 'Door assembly completed', date: assemblyDate },
    { type: 'BARCODE_GENERATED', details: `Barcode ${assembly.barcode.barcodeValue}`, date: daysAgo(11 - index) },
  ];

  if (config.fipsStatus === 'SUBMITTED' || config.fipsStatus === 'APPROVED') {
    events.push({ type: 'FIPS_SUBMITTED', details: 'FIPS documents submitted', date: daysAgo(10 - index) });
  }
  if (config.fipsStatus === 'APPROVED') {
    events.push({ type: 'FIPS_APPROVED', details: 'FIPS approved', date: daysAgo(9 - index) });
  }
  if (config.qcStatus === 'CHECKED') {
    events.push({ type: 'QC_APPROVED', details: 'Quality check passed', date: daysAgo(8 - index) });
  }
  if (config.qcStatus === 'REJECTED') {
    events.push({ type: 'QC_REJECTED', details: 'Quality check rejected', date: daysAgo(8 - index) });
  }

  if (config.locationCode === 'BH') {
    await prisma.storageMovement.create({
      data: {
        assemblyId: assembly.id,
        fromLocationId: null,
        toLocationId: locations.BH.id,
        movedAt: daysAgo(7 - index),
        notes: 'Initial move to BH storage after QC',
      },
    });
    events.push({ type: 'MOVED_TO_BH_STORAGE', details: 'Moved to BH Storage', date: daysAgo(7 - index) });
  }

  if (config.locationCode === 'CAMDEN') {
    await prisma.storageMovement.create({
      data: {
        assemblyId: assembly.id,
        fromLocationId: locations.BH.id,
        toLocationId: locations.CAMDEN.id,
        movedAt: daysAgo(6 - index),
        notes: 'Transferred to Camden storage',
      },
    });
    events.push(
      { type: 'MOVED_TO_BH_STORAGE', details: 'Moved to BH Storage', date: daysAgo(7 - index) },
      { type: 'MOVED_TO_CAMDEN', details: 'Moved to Camden Storage', date: daysAgo(6 - index) },
    );
  }

  if (config.locationCode === 'CONTAINER') {
    await prisma.storageMovement.create({
      data: {
        assemblyId: assembly.id,
        fromLocationId: locations.BH.id,
        toLocationId: locations.CONTAINER.id,
        movedAt: daysAgo(6 - index),
        notes: 'Transferred to container storage',
      },
    });
    events.push(
      { type: 'MOVED_TO_BH_STORAGE', details: 'Moved to BH Storage', date: daysAgo(7 - index) },
      { type: 'MOVED_TO_CONTAINER', details: 'Moved to Container Storage', date: daysAgo(6 - index) },
    );
  }

  if (config.delivery) {
    const deliveryDate = daysAgo(5 - index);
    await prisma.delivery.create({
      data: {
        deliveryNumber: `DN-2026-${String(index + 1).padStart(4, '0')}`,
        assemblyId: assembly.id,
        jobNumber,
        serialNumber,
        deliveryDate,
        siteId: config.siteId,
        driver: config.driver,
        vehicleNumber: config.vehicle,
        type: config.deliveryType || 'DELIVERY',
        notes: config.deliveryNotes,
      },
    });

    await prisma.siteDoor.create({
      data: {
        assemblyId: assembly.id,
        jobNumber,
        serialNumber,
        siteId: config.siteId,
        deliveredDate: deliveryDate,
        status: config.siteDoorStatus,
      },
    });

    events.push({
      type: config.deliveryType === 'CUSTOMER_COLLECTION' ? 'COLLECTED' : 'DELIVERED',
      details: `Delivered to ${config.siteName}`,
      date: deliveryDate,
    });
    events.push({ type: 'MOVED_TO_SITE', details: 'Moved to site', date: deliveryDate });

    if (config.siteDoorStatus === 'INSTALLED') {
      events.push({ type: 'STATUS_CHANGED', details: 'Door installed on site', date: daysAgo(4 - index) });
    }
  }

  if (config.returnRecord) {
    const returnDate = daysAgo(3 - index);
    await prisma.return.create({
      data: {
        assemblyId: assembly.id,
        jobNumber,
        serialNumber,
        returnedFrom: config.siteName,
        returnDate,
        returnReasonId: returnReasons[config.returnReasonIndex].id,
        notes: config.returnNotes,
      },
    });

    await prisma.storageMovement.create({
      data: {
        assemblyId: assembly.id,
        fromLocationId: locations.SITE.id,
        toLocationId: locations.BH.id,
        movedAt: returnDate,
        notes: 'Returned from site to BH',
      },
    });

    events.push(
      { type: 'RETURNED_FROM_SITE', details: `Returned from ${config.siteName}`, date: returnDate },
      { type: 'RETURNED_TO_BH', details: 'Back in BH storage', date: returnDate },
    );
  }

  await logEvents(assembly.id, jobNumber, serialNumber, events);

  await prisma.activityLog.create({
    data: {
      userId,
      action: config.activityAction,
      module: config.activityModule,
      entityId: assembly.id,
      details: config.activityDetails,
      createdAt: daysAgo(2 - index),
    },
  });

  return assembly;
}

async function seedSupplementaryRecords(assemblies, sites, returnReasons, locations, userId) {
  const drivers = ['John Smith', 'Sarah Jones', 'Mike Brown', 'Emma Wilson', 'David Lee', 'Lisa Chen', 'Tom Harris'];
  const vehicles = ['AB12 CDE', 'FG34 HIJ', 'KL56 MNO', 'PQ78 RST', 'UV90 WXY', 'ZX12 ABC', 'DE34 FGH'];

  for (let i = 0; i < 7; i++) {
    const assembly = assemblies[i];
    const site = sites[i];
    const deliveryDate = daysAgo(20 - i);

    const existingDelivery = await prisma.delivery.findFirst({
      where: { assemblyId: assembly.id },
    });
    if (!existingDelivery) {
      await prisma.delivery.create({
        data: {
          deliveryNumber: `DN-2026-${String(i + 1).padStart(4, '0')}`,
          assemblyId: assembly.id,
          jobNumber: assembly.jobNumber,
          serialNumber: assembly.serialNumber,
          deliveryDate,
          siteId: site.id,
          driver: drivers[i],
          vehicleNumber: vehicles[i],
          type: i % 3 === 0 ? 'CUSTOMER_COLLECTION' : 'DELIVERY',
          notes: `Delivery to ${site.name}`,
        },
      });
    }

    const existingSiteDoor = await prisma.siteDoor.findFirst({
      where: { assemblyId: assembly.id },
    });
    if (!existingSiteDoor) {
      const statuses = ['AT_SITE', 'INSTALLED', 'AT_SITE', 'INSTALLED', 'AT_SITE', 'INSTALLED', 'RETURNED'];
      await prisma.siteDoor.create({
        data: {
          assemblyId: assembly.id,
          jobNumber: assembly.jobNumber,
          serialNumber: assembly.serialNumber,
          siteId: site.id,
          deliveredDate: deliveryDate,
          status: statuses[i],
        },
      });
    }

    await prisma.return.create({
      data: {
        assemblyId: assembly.id,
        jobNumber: assembly.jobNumber,
        serialNumber: assembly.serialNumber,
        returnedFrom: site.name,
        returnDate: daysAgo(10 - i),
        returnReasonId: returnReasons[i % returnReasons.length].id,
        notes: `Return from ${site.name} — ${returnReasons[i % returnReasons.length].name}`,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'UPDATE',
        module: ['Storage', 'Delivery', 'Site', 'Returns', 'FIPS', 'QualityCheck', 'Assembly'][i],
        entityId: assembly.id,
        details: `Sample activity for job ${assembly.jobNumber}`,
        createdAt: daysAgo(1 + i),
      },
    });
  }
}

async function seedReadyForAssemblyOnly() {
  for (let i = 0; i < DEMO_READY_JOBS.length; i++) {
    const jobNumber = DEMO_READY_JOBS[i];
    const serialNumber = String(201 + i);
    await createReadyComponents(
      jobNumber,
      serialNumber,
      daysAgo(i),
      CELL_LIGHTS[i],
      false,
    );
  }
}

const FIPS_DOCUMENT_SETS = [
  [{ label: 'FIPS-Draft-Form', color: [100, 116, 139] }],
  [
    { label: 'FIPS-Submission-Form', color: [37, 99, 235] },
    { label: 'Fire-Rating-Certificate', color: [220, 38, 38] },
  ],
  [
    { label: 'FIPS-Compliance-Certificate', color: [22, 101, 52] },
    { label: 'Door-Installation-Photo', color: [124, 58, 237] },
  ],
  [
    { label: 'FIPS-Approval-Letter', color: [15, 118, 110] },
    { label: 'Site-Handover-Photo', color: [234, 88, 12] },
  ],
  [
    { label: 'Container-Storage-Checklist', color: [79, 70, 229] },
    { label: 'QC-Inspection-Photo', color: [190, 24, 93] },
  ],
  [
    { label: 'Installation-Signoff', color: [21, 128, 61] },
    { label: 'Greenwich-Site-Photo', color: [14, 165, 233] },
  ],
  [
    { label: 'Return-Damage-Report', color: [185, 28, 28] },
    { label: 'Returned-Door-Photo', color: [161, 98, 7] },
  ],
];

async function seedFipsDocuments(userId) {
  const fipsForms = await prisma.fipsForm.findMany({
    where: { jobNumber: { in: DEMO_ASSEMBLY_JOBS } },
    orderBy: { jobNumber: 'asc' },
  });

  let totalDocs = 0;

  for (let i = 0; i < fipsForms.length; i++) {
    const fips = fipsForms[i];
    const docSet = FIPS_DOCUMENT_SETS[i] || FIPS_DOCUMENT_SETS[2];

    for (let d = 0; d < docSet.length; d++) {
      const docMeta = docSet[d];
      const safeJob = fips.jobNumber.replace('.', '');
      const storedName = `${safeJob}-${docMeta.label}.png`;
      const displayName = `${docMeta.label}-${fips.jobNumber}.png`;
      const absPath = path.join(__dirname, '../uploads/fips/seed', storedName);

      const fileSize = createDocumentPng({
        filePath: absPath,
        headerColor: docMeta.color,
        accentColor: [226, 232, 240],
      });

      await prisma.uploadedDocument.create({
        data: {
          entityType: 'fips_form',
          entityId: fips.id,
          fipsFormId: fips.id,
          fileName: displayName,
          filePath: absPath,
          mimeType: 'image/png',
          fileSize,
          uploadedById: userId,
          uploadedAt: daysAgo(11 - i - d),
        },
      });

      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPLOAD',
          module: 'fips',
          entityId: fips.id,
          details: displayName,
          createdAt: daysAgo(11 - i - d),
        },
      });

      totalDocs += 1;
    }
  }

  return totalDocs;
}

async function main() {
  console.log('Seeding AssemblyFlow ERP database...');

  await cleanupDemoData();
  const user = await seedReferenceData();
  console.log('Reference data seeded');

  const locations = {
    BH: await prisma.storageLocation.findUniqueOrThrow({ where: { code: 'BH' } }),
    CAMDEN: await prisma.storageLocation.findUniqueOrThrow({ where: { code: 'CAMDEN' } }),
    SITE: await prisma.storageLocation.findUniqueOrThrow({ where: { code: 'SITE' } }),
    CONTAINER: await prisma.storageLocation.findUniqueOrThrow({ where: { code: 'CONTAINER' } }),
  };

  const sites = await prisma.site.findMany({ orderBy: { name: 'asc' } });
  const returnReasons = await prisma.returnReason.findMany({ orderBy: { code: 'asc' } });

  const assemblyConfigs = [
    {
      fipsStatus: 'PENDING',
      qcStatus: 'PENDING',
      locationCode: 'BH',
      locationId: locations.BH.id,
      activityAction: 'CREATE',
      activityModule: 'Assembly',
      activityDetails: 'Assembly completed — awaiting FIPS & QC',
    },
    {
      fipsStatus: 'SUBMITTED',
      qcStatus: 'PENDING',
      locationCode: 'BH',
      locationId: locations.BH.id,
      activityAction: 'UPDATE',
      activityModule: 'FIPS',
      activityDetails: 'FIPS documents submitted for review',
    },
    {
      fipsStatus: 'APPROVED',
      qcStatus: 'CHECKED',
      locationCode: 'BH',
      locationId: locations.BH.id,
      activityAction: 'UPDATE',
      activityModule: 'QualityCheck',
      activityDetails: 'QC approved — stored in BH',
    },
    {
      fipsStatus: 'APPROVED',
      qcStatus: 'CHECKED',
      locationCode: 'CAMDEN',
      locationId: locations.CAMDEN.id,
      activityAction: 'MOVE',
      activityModule: 'Storage',
      activityDetails: 'Moved from BH to Camden storage',
    },
    {
      fipsStatus: 'APPROVED',
      qcStatus: 'CHECKED',
      locationCode: 'CONTAINER',
      locationId: locations.CONTAINER.id,
      activityAction: 'MOVE',
      activityModule: 'Storage',
      activityDetails: 'Moved to container storage',
    },
    {
      fipsStatus: 'APPROVED',
      qcStatus: 'CHECKED',
      locationCode: 'SITE',
      locationId: locations.SITE.id,
      siteId: sites[1].id,
      siteName: sites[1].name,
      delivery: true,
      siteDoorStatus: 'INSTALLED',
      driver: 'Sarah Jones',
      vehicle: 'FG34 HIJ',
      deliveryNotes: 'Delivered and installed at Greenwich',
      activityAction: 'UPDATE',
      activityModule: 'Site',
      activityDetails: 'Door installed at Greenwich Site',
    },
    {
      fipsStatus: 'APPROVED',
      qcStatus: 'CHECKED',
      locationCode: 'BH',
      locationId: locations.BH.id,
      siteId: sites[2].id,
      siteName: sites[2].name,
      delivery: true,
      siteDoorStatus: 'RETURNED',
      driver: 'Mike Brown',
      vehicle: 'KL56 MNO',
      deliveryNotes: 'Delivered to Birmingham Tower',
      returnRecord: true,
      returnReasonIndex: 2,
      returnNotes: 'Door damaged during installation',
      activityAction: 'RETURN',
      activityModule: 'Returns',
      activityDetails: 'Door returned from Birmingham Tower — damage',
    },
  ];

  const assemblies = [];
  for (let i = 0; i < DEMO_ASSEMBLY_JOBS.length; i++) {
    const assembly = await seedAssemblyWorkflow({
      index: i,
      jobNumber: DEMO_ASSEMBLY_JOBS[i],
      serialNumber: String(101 + i),
      userId: user.id,
      locations,
      sites,
      returnReasons,
      config: assemblyConfigs[i],
    });
    assemblies.push(assembly);
  }
  console.log('7 assembly workflows seeded (assemblies, barcodes, FIPS, QC, storage, deliveries, returns)');

  await seedSupplementaryRecords(assemblies, sites, returnReasons, locations, user.id);
  console.log('7 deliveries, site doors, returns, and activity logs seeded');

  const docCount = await seedFipsDocuments(user.id);
  console.log(`${docCount} FIPS document images seeded`);

  await seedReadyForAssemblyOnly();
  console.log('7 ready-for-assembly job pairs seeded (14 components)');

  console.log('Seed completed successfully!');
  console.log('Login: admin@assemblyflow.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
