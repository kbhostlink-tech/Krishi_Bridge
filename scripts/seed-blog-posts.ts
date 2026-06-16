/**
 * Seeds SEO blog posts. Safe to re-run — upserts by slug.
 * Usage: npm run seed:blogs
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { SEO_BLOG_POSTS } from "../src/lib/seo-blog-posts";

function loadEnvFile(filename: string) {
  const filePath = resolve(process.cwd(), filename);
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    if (process.env[key]) continue;
    process.env[key] = match[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

function createPrisma() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  return { prisma: new PrismaClient({ adapter }), pool };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env before seeding blogs.");
  }

  const { prisma, pool } = createPrisma();

  try {
    const author =
      (await prisma.user.findFirst({
        where: { adminRole: "SUPER_ADMIN" },
        orderBy: { createdAt: "asc" },
      })) ??
      (await prisma.user.findFirst({
        where: { role: "ADMIN" },
        orderBy: { createdAt: "asc" },
      })) ??
      (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));

    if (!author) {
      throw new Error("No user found to assign as blog author. Create an admin user first.");
    }

    console.log(`Using author: ${author.name} (${author.id})`);

    for (const post of SEO_BLOG_POSTS) {
      const publishedAt = new Date();
      publishedAt.setDate(publishedAt.getDate() - post.publishedDaysAgo);

      const saved = await prisma.blogPost.upsert({
        where: { slug: post.slug },
        create: {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          coverImage: post.coverImage,
          content: post.content as Prisma.InputJsonValue,
          status: "PUBLISHED",
          authorId: author.id,
          publishedAt,
        },
        update: {
          title: post.title,
          excerpt: post.excerpt,
          coverImage: post.coverImage,
          content: post.content as Prisma.InputJsonValue,
          status: "PUBLISHED",
          publishedAt,
        },
      });

      console.log(`✓ ${saved.slug}`);
    }

    console.log(`\nSeeded ${SEO_BLOG_POSTS.length} published blog posts.`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
