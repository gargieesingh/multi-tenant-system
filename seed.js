/**
 * Seed Script — Multi-Tenant System
 *
 * Run with: node seed.js
 *
 * Creates:
 *  - 1 Superadmin
 *  - Org Alpha: 1 Admin, 1 Project, 1 Member (added to Project Alpha)
 *  - Org Beta:  1 Admin, 1 Project, 1 Member (added to Project Beta only)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting seed script...\n');

  // ─── 1. Clear existing data (correct FK order) ───────────────────────────
  console.log('🧹 Clearing existing data...');
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  console.log('   ✅ All data cleared.\n');

  // ─── 2. Create Superadmin ─────────────────────────────────────────────────
  console.log('👤 Creating Superadmin...');
  const superadmin = await prisma.user.create({
    data: {
      email: 'super@admin.com',
      password: await bcrypt.hash('super123', SALT_ROUNDS),
      role: 'SUPERADMIN',
    },
    select: { id: true, email: true, role: true },
  });
  console.log(`   ✅ Superadmin: ${superadmin.email} (ID: ${superadmin.id})\n`);

  // ─── 3. Create Org Alpha ──────────────────────────────────────────────────
  console.log('🏢 Creating Org Alpha...');
  const orgAlpha = await prisma.organization.create({
    data: { name: 'Org Alpha' },
    select: { id: true, name: true },
  });
  console.log(`   ✅ Organization: ${orgAlpha.name} (ID: ${orgAlpha.id})`);

  const adminAlpha = await prisma.user.create({
    data: {
      email: 'admin@alpha.com',
      password: await bcrypt.hash('admin123', SALT_ROUNDS),
      role: 'ADMIN',
      organizationId: orgAlpha.id,
    },
    select: { id: true, email: true, role: true },
  });
  console.log(`   ✅ Admin: ${adminAlpha.email} (ID: ${adminAlpha.id})`);

  const projectAlpha = await prisma.project.create({
    data: {
      name: 'Project Alpha',
      description: 'The flagship project for Org Alpha.',
      organizationId: orgAlpha.id,
    },
    select: { id: true, name: true },
  });
  console.log(`   ✅ Project: ${projectAlpha.name} (ID: ${projectAlpha.id})`);

  const memberAlpha = await prisma.user.create({
    data: {
      email: 'member@alpha.com',
      password: await bcrypt.hash('member123', SALT_ROUNDS),
      role: 'MEMBER',
      organizationId: orgAlpha.id,
    },
    select: { id: true, email: true, role: true },
  });
  console.log(`   ✅ Member: ${memberAlpha.email} (ID: ${memberAlpha.id})`);

  const membershipAlpha = await prisma.projectMember.create({
    data: { userId: memberAlpha.id, projectId: projectAlpha.id },
    select: { id: true },
  });
  console.log(
    `   ✅ Added ${memberAlpha.email} to ${projectAlpha.name} (Membership ID: ${membershipAlpha.id})\n`
  );

  // ─── 4. Create Org Beta ───────────────────────────────────────────────────
  console.log('🏢 Creating Org Beta...');
  const orgBeta = await prisma.organization.create({
    data: { name: 'Org Beta' },
    select: { id: true, name: true },
  });
  console.log(`   ✅ Organization: ${orgBeta.name} (ID: ${orgBeta.id})`);

  const adminBeta = await prisma.user.create({
    data: {
      email: 'admin@beta.com',
      password: await bcrypt.hash('admin123', SALT_ROUNDS),
      role: 'ADMIN',
      organizationId: orgBeta.id,
    },
    select: { id: true, email: true, role: true },
  });
  console.log(`   ✅ Admin: ${adminBeta.email} (ID: ${adminBeta.id})`);

  const projectBeta = await prisma.project.create({
    data: {
      name: 'Project Beta',
      description: 'The flagship project for Org Beta.',
      organizationId: orgBeta.id,
    },
    select: { id: true, name: true },
  });
  console.log(`   ✅ Project: ${projectBeta.name} (ID: ${projectBeta.id})`);

  const memberBeta = await prisma.user.create({
    data: {
      email: 'member@beta.com',
      password: await bcrypt.hash('member123', SALT_ROUNDS),
      role: 'MEMBER',
      organizationId: orgBeta.id,
    },
    select: { id: true, email: true, role: true },
  });
  console.log(`   ✅ Member: ${memberBeta.email} (ID: ${memberBeta.id})`);

  const membershipBeta = await prisma.projectMember.create({
    data: { userId: memberBeta.id, projectId: projectBeta.id },
    select: { id: true },
  });
  console.log(
    `   ✅ Added ${memberBeta.email} to ${projectBeta.name} (Membership ID: ${membershipBeta.id})\n`
  );

  // ─── 5. Summary ──────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 SEED COMPLETE — Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📋 SUPERADMIN');
  console.log(`   Email:    super@admin.com`);
  console.log(`   Password: super123`);
  console.log(`   ID:       ${superadmin.id}`);

  console.log('\n🏢 ORG ALPHA');
  console.log(`   Org ID:         ${orgAlpha.id}`);
  console.log(`   Admin Email:    admin@alpha.com    (Password: admin123, ID: ${adminAlpha.id})`);
  console.log(`   Project:        Project Alpha      (ID: ${projectAlpha.id})`);
  console.log(`   Member Email:   member@alpha.com   (Password: member123, ID: ${memberAlpha.id})`);

  console.log('\n🏢 ORG BETA');
  console.log(`   Org ID:         ${orgBeta.id}`);
  console.log(`   Admin Email:    admin@beta.com     (Password: admin123, ID: ${adminBeta.id})`);
  console.log(`   Project:        Project Beta       (ID: ${projectBeta.id})`);
  console.log(`   Member Email:   member@beta.com    (Password: member123, ID: ${memberBeta.id})`);
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
