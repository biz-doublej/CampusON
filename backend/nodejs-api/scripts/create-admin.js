/* Seed or update an ADMIN user: user_id=admin, email=admin@kbu.ac.kr, pw=1234 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@kbu.ac.kr';
  const userId = 'admin';
  const plain = '123456';
  const password = await bcrypt.hash(plain, 12);

  const byEmail = await prisma.user.findUnique({ where: { email } }).catch(() => null);
  const byUserId = await prisma.user.findUnique({ where: { user_id: userId } }).catch(() => null);
  const existing = byEmail || byUserId;

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { email, user_id: userId, name: 'Admin', role: 'ADMIN', password },
    });
    console.log('[seed-admin] Updated existing admin:', { id: updated.id, email: updated.email, role: updated.role });
  } else {
    const created = await prisma.user.create({
      data: { email, user_id: userId, name: 'Admin', role: 'ADMIN', password },
    });
    console.log('[seed-admin] Created admin:', { id: created.id, email: created.email, role: created.role });
  }
}

main()
  .catch((e) => { console.error('[seed-admin] Failed:', e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });

