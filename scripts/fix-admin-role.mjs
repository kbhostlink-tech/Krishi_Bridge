import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const client = new Client({ connectionString });
await client.connect();

const result = await client.query(
  'SELECT id, email, "adminRole" FROM "User" WHERE role = $1',
  ["ADMIN"]
);
console.log("Admin users:", JSON.stringify(result.rows, null, 2));

// Fix any ADMIN users with null adminRole
const fix = await client.query(
  'UPDATE "User" SET "adminRole" = $1 WHERE role = $2 AND "adminRole" IS NULL RETURNING id, email',
  ["SUPER_ADMIN", "ADMIN"]
);
if (fix.rows.length > 0) {
  console.log("\n✅ Fixed adminRole for:", fix.rows);
} else {
  console.log("\n✔ All admin users already have adminRole set.");
}

await client.end();
