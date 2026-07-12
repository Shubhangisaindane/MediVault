const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing records (Optional, but helps in clean seeding)
  // Disable foreign key checks or delete in reverse dependency order
  console.log('Cleaning old data...');
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.prescriptionItem.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.medicine.deleteMany({});
  await prisma.appointmentRequest.deleteMany({});
  await prisma.visit.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.session.deleteMany({});

  console.log('Hashing default passwords...');
  const adminPassword = await argon2.hash('admin123');
  const doctorPassword = await argon2.hash('doctor123');
  const receptionistPassword = await argon2.hash('receptionist123');
  const patientPassword = await argon2.hash('patient123');

  // 2. Create Admin User
  console.log('Creating Admin...');
  await prisma.user.create({
    data: {
      email: 'admin@medivault.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // 3. Create Doctor Record and User
  console.log('Creating Doctor...');
  const doctorRecord = await prisma.doctor.create({
    data: {
      firstName: 'Elizabeth',
      lastName: 'Blackwell',
      specialization: 'Cardiology',
      department: 'Cardiology Department',
      email: 'doctor@medivault.com',
      phone: '+1 (555) 123-4567',
      availability: {
        Monday: ['09:00-12:00', '14:00-17:00'],
        Wednesday: ['09:00-12:00', '14:00-17:00'],
        Friday: ['09:00-12:00'],
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'doctor@medivault.com',
      passwordHash: doctorPassword,
      role: 'DOCTOR',
      doctorId: doctorRecord.id,
    },
  });

  // 4. Create Receptionist User
  console.log('Creating Receptionist...');
  await prisma.user.create({
    data: {
      email: 'receptionist@medivault.com',
      passwordHash: receptionistPassword,
      role: 'RECEPTIONIST',
    },
  });

  // 5. Create Patient Record and User
  console.log('Creating Patient...');
  const patientRecord = await prisma.patient.create({
    data: {
      mrn: 'MRN-928410',
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-05-15'),
      sex: 'Female',
      phone: '+1 (555) 987-6543',
      email: 'patient@medivault.com',
      address: '742 Evergreen Terrace, Springfield',
      createdById: 'system',
    },
  });

  await prisma.user.create({
    data: {
      email: 'patient@medivault.com',
      passwordHash: patientPassword,
      role: 'PATIENT',
      patientId: patientRecord.id,
    },
  });

  // 6. Create Pharmacy Inventory
  console.log('Creating Medicine Inventory...');
  const medicines = [
    { name: 'Paracetamol 500mg', category: 'Analgesics', stock: 1500 },
    { name: 'Amoxicillin 500mg', category: 'Antibiotics', stock: 800 },
    { name: 'Ibuprofen 400mg', category: 'NSAIDs', stock: 1200 },
    { name: 'Metformin 850mg', category: 'Antidiabetics', stock: 600 },
    { name: 'Atorvastatin 20mg', category: 'Cardiovascular', stock: 950 },
    { name: 'Lisinopril 10mg', category: 'Antihypertensives', stock: 400 },
    { name: 'Albuterol Inhaler', category: 'Bronchodilators', stock: 120 },
    { name: 'Omeprazole 20mg', category: 'Antacids', stock: 1100 },
  ];

  for (const med of medicines) {
    await prisma.medicine.create({
      data: med,
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
