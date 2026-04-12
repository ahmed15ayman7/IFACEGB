import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding IFACE GB database...");

  // ── Sectors ──────────────────────────────────────────────
  const sectors = await Promise.all([
    prisma.sector.upsert({
      where: { code: "training" },
      update: {},
      create: {
        code: "training",
        nameEn: "Training & Development",
        nameAr: "التدريب والتطوير",
        description: "Comprehensive professional training programs, LMS, and virtual classrooms.",
        color: "#C9A227",
        sortOrder: 1,
        targetRevPct: 40,
      },
    }),
    prisma.sector.upsert({
      where: { code: "accreditation" },
      update: {},
      create: {
        code: "accreditation",
        nameEn: "International Accreditation",
        nameAr: "الاعتماد الدولي",
        description: "World-recognized institutional and program accreditation.",
        color: "#A8B5C8",
        sortOrder: 2,
        targetRevPct: 25,
      },
    }),
    prisma.sector.upsert({
      where: { code: "consultancy" },
      update: {},
      create: {
        code: "consultancy",
        nameEn: "Consultancy & Institutional Excellence",
        nameAr: "الاستشارات والتميز المؤسسي",
        description: "Strategic institutional consulting, ISO compliance, and performance excellence.",
        color: "#e8c84a",
        sortOrder: 3,
        targetRevPct: 20,
      },
    }),
    prisma.sector.upsert({
      where: { code: "tech" },
      update: {},
      create: {
        code: "tech",
        nameEn: "Tech Engine",
        nameAr: "محرك التقنية",
        description: "Cutting-edge EdTech, AI-powered learning, and digital infrastructure.",
        color: "#6e7d93",
        sortOrder: 4,
        targetRevPct: 0,
      },
    }),
    prisma.sector.upsert({
      where: { code: "partnerships" },
      update: {},
      create: {
        code: "partnerships",
        nameEn: "Global Partnerships & Franchises",
        nameAr: "الشراكات العالمية",
        description: "Master franchise network, international alliances, cross-border expansion.",
        color: "#9C2A2A",
        sortOrder: 5,
        targetRevPct: 15,
      },
    }),
  ]);
  console.log(`✓ ${sectors.length} sectors seeded`);

  // ── Super Admin ───────────────────────────────────────────
  const adminHash = await bcrypt.hash("iFACE@Admin2026!", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@iface.global" },
    update: {},
    create: {
      email: "admin@iface.global",
      name: "iFACE Super Admin",
      nameAr: "المدير العام",
      passwordHash: adminHash,
      role: "super_admin",
      isActive: true,
      locale: "ar",
    },
  });
  console.log(`✓ Super admin: ${superAdmin.email}`);

  // ── Central Treasury Wallet ───────────────────────────────
  await prisma.wallet.upsert({
    where: { id: "central-treasury-wallet" },
    update: {},
    create: {
      id: "central-treasury-wallet",
      ownerId: superAdmin.id,
      walletType: "CentralTreasury",
      balanceCoins: 0,
    },
  });

  // ── Sovereign Reserve ────────────────────────────────────
  await prisma.sovereignReserveSubAccount.upsert({
    where: { id: "sovereign-reserve-main" },
    update: {},
    create: {
      id: "sovereign-reserve-main",
      totalLocked: 0,
      isHardLocked: true,
    },
  });

  // ── Sector Wallets ───────────────────────────────────────
  for (const sector of sectors) {
    await prisma.wallet.upsert({
      where: { id: `sector-wallet-${sector.code}` },
      update: {},
      create: {
        id: `sector-wallet-${sector.code}`,
        ownerId: superAdmin.id,
        sectorId: sector.id,
        walletType: "SectorWallet",
        balanceCoins: 0,
      },
    });
  }
  console.log("✓ Wallets seeded");

  // ── Financial Settings ────────────────────────────────────
  await prisma.financialSettings.upsert({
    where: { id: "global-financial-settings" },
    update: {},
    create: {
      id: "global-financial-settings",
      baseCurrency: "EGP",
      coinToFiatRate: 1.0,
      vatPercent: 14.0,
      withholdingTaxPct: 20.0,
      multiSigThreshold: 50000,
      ifaceCommissionPct: 40.0,
      agentCommissionPct: 35.0,
      lecturerCommissionPct: 25.0,
    },
  });
  console.log("✓ Financial settings seeded");

  // ── Sample VR Scenarios ───────────────────────────────────
  await prisma.vrScenario.createMany({
    data: [
      { titleEn: "ICU Emergency Protocol", titleAr: "بروتوكول طوارئ العناية المركزة", category: "medical", difficulty: "hard" },
      { titleEn: "Operating Room Simulation", titleAr: "محاكاة غرفة العمليات", category: "medical", difficulty: "medium" },
      { titleEn: "Emergency Room Triage", titleAr: "فرز حالات الطوارئ", category: "medical", difficulty: "hard" },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
