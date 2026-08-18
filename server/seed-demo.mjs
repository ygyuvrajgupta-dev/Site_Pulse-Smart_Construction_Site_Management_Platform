/** Seed script: Create demo company, role, and user */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "Demo@123";
const DEMO_COMPANY_SLUG = "demo-company";
async function main() {
  console.log("Seeding demo data...");
  const company = await prisma.company.upsert({
    where: { slug: DEMO_COMPANY_SLUG },
    update: { name: "Demo Company", isActive: true },
    create: { name: "Demo Company", slug: DEMO_COMPANY_SLUG, email: "admin@demo.com", phone: "+10000000000", website: "https://demo.example.com", isActive: true },
  });
  console.log("Company:", company.id);
  const role = await prisma.role.upsert({
    where: { companyId_slug: { companyId: company.id, slug: "admin" } },
    update: { name: "Admin", isSystem: true },
    create: { companyId: company.id, name: "Admin", slug: "admin", isSystem: true },
  });
  console.log("Role:", role.slug);
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);
  const existingUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  const user = existingUser
    ? await prisma.user.update({ where: { email: DEMO_EMAIL }, data: { companyId: company.id, roleId: role.id, password: hashedPassword, name: "Demo User", status: "ACTIVE", emailVerified: true } })
    : await prisma.user.create({ data: { companyId: company.id, roleId: role.id, email: DEMO_EMAIL, password: hashedPassword, name: "Demo User", status: "ACTIVE", emailVerified: true } });
  console.log("User:", user.email, "status:", user.status);
  console.log("\nSeed complete! Login: demo@example.com / Demo@123");
}
main().catch((e) => { console.error("Seed failed:", e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
