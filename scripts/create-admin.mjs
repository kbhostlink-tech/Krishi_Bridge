/**
 * Admin User Creation Script
 * Run: node scripts/create-admin.mjs
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";
import * as readline from "readline/promises";
import { randomUUID } from "crypto";

const { Client } = pg;

// ─── CONFIG (edit before running) ────────────────────────

const ADMIN = {
  name: "Super Admin",
  email: "admin@agriexchange.com",
  password: "Admin@123456",   // ← change this to a strong password
  country: "IN",              // IN | NP | BT | AE | SA | OM
};

// ─────────────────────────────────────────────────────────

const CURRENCY_MAP = { IN: "INR", NP: "NPR", BT: "BTN", AE: "AED", SA: "SAR", OM: "OMR" };

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("\n❌ DATABASE_URL is not set in .env\n");
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("\n🌿 AgriExchange — Admin User Setup\n");
  console.log(`  Name    : ${ADMIN.name}`);
  console.log(`  Email   : ${ADMIN.email}`);
  console.log(`  Country : ${ADMIN.country}`);
  console.log(`  Password: ${"*".repeat(ADMIN.password.length)}\n`);

  const confirm = await rl.question("Create this admin user? (yes/no): ");
  rl.close();

  if (confirm.trim().toLowerCase() !== "yes") {
    console.log("\nAborted.\n");
    process.exit(0);
  }

  // Use DIRECT_URL for better connection reliability, fallback to DATABASE_URL
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  const client = new Client({ connectionString });
  await client.connect();

  try {
    // Check if user already exists
    const existing = await client.query(
      'SELECT id FROM "User" WHERE email = $1 LIMIT 1',
      [ADMIN.email]
    );

    if (existing.rows.length > 0) {
      console.error(`\n❌ A user with email "${ADMIN.email}" already exists.`);
      console.error(`   Edit ADMIN.email in the script to use a different address.\n`);
      process.exit(1);
    }

    // Hash password
    console.log("\n⏳ Hashing password...");
    const passwordHash = await bcrypt.hash(ADMIN.password, 12);
    const id = randomUUID();
    const preferredCurrency = CURRENCY_MAP[ADMIN.country] ?? "USD";
    const now = new Date().toISOString();

    // Insert admin user
    await client.query(
      `INSERT INTO "User" (
        id, email, "passwordHash", name, role, country,
        "preferredCurrency", "preferredLang", "kycStatus",
        "isActive", "emailVerified", "tokenVersion",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9,
        $10, $11, $12,
        $13, $14
      )`,
      [
        id, ADMIN.email, passwordHash, ADMIN.name, "ADMIN", ADMIN.country,
        preferredCurrency, "en", "APPROVED",
        true, true, 0,
        now, now,
      ]
    );

    console.log("\n✅ Admin user created successfully!\n");
    console.log(`   ID      : ${id}`);
    console.log(`   Email   : ${ADMIN.email}`);
    console.log(`   Role    : ADMIN`);
    console.log(`   KYC     : APPROVED`);
    console.log(`\n   Login at: http://localhost:3000/login\n`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
