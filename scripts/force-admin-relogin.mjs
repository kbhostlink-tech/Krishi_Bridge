import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const client = new Client({ connectionString });
await client.connect();

// Bump tokenVersion to force re-login (invalidates all existing tokens)
const result = await client.query(
  'UPDATE "User" SET "tokenVersion" = "tokenVersion" + 1 WHERE role = $1 AND "adminRole" = $2 RETURNING id, email',
  ["ADMIN", "SUPER_ADMIN"]
);

if (result.rows.length > 0) {
  console.log("✅ Forced re-login for admin users:", result.rows);
  console.log("\nPlease log out and log back in as admin.");
} else {
  console.log("No admin users found to update.");
}

await client.end();
