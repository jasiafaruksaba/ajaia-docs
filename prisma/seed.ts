import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = [
    { email: "alice@test.com", name: "Alice" },
    { email: "bob@test.com", name: "Bob" },
    { email: "carol@test.com", name: "Carol" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }

  const alice = await prisma.user.findUniqueOrThrow({
    where: { email: "alice@test.com" },
  });

  const existing = await prisma.document.findFirst({
    where: { ownerId: alice.id, title: "Welcome Doc" },
  });

  if (!existing) {
    await prisma.document.create({
      data: {
        title: "Welcome Doc",
        ownerId: alice.id,
        content:
          "<h1>Welcome</h1><p>This is a <strong>sample</strong> document. Try sharing it with Bob.</p><ul><li>Edit me</li><li>Share me</li></ul>",
      },
    });
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());