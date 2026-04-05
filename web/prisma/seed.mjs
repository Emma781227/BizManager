import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Créer un commerçant par défaut
  const passwordHash = await bcrypt.hash("Commerce123!", 10);
  const merchant = await prisma.user.upsert({
    where: { email: "merchant@test.local" },
    update: {},
    create: {
      email: "merchant@test.local",
      fullName: "Jean Dupont",
      phone: "+237655000000",
      passwordHash: passwordHash,
    },
  });
  console.log(`✅ Merchant created: ${merchant.email}`);

  const shop = await prisma.shop.upsert({
    where: { userId: merchant.id },
    update: {},
    create: {
      userId: merchant.id,
      slug: "bizmanager-douala",
      name: "BizManager",
      logoUrl: "https://picsum.photos/120/120?random=10",
      coverUrl: "https://picsum.photos/1200/400?random=11",
      description: "Boutique mode, accessoires et beaute a Douala.",
      city: "Douala",
      whatsappNumber: "+237655000000",
      category: "Commerce de detail",
      address: "Douala, Cameroun",
      openingHours: "Lun-Sam 8h-19h",
      isPublished: true,
    },
  });
  console.log(`✅ Shop created: ${shop.slug}`);

  // Créer quelques produits pour le commerçant
  const products = await Promise.all([
    prisma.product.upsert({
      where: { 
        id: "prod_1",
      },
      update: {},
      create: {
        id: "prod_1",
        userId: merchant.id,
        name: "Robe Ankara",
        sku: "ROBE-001",
        unitPrice: "8500.00",
        stock: 15,
        imageUrl: "https://picsum.photos/300/300?random=1",
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod_2" },
      update: {},
      create: {
        id: "prod_2",
        userId: merchant.id,
        name: "Crème Éclaircissante",
        sku: "CREAM-001",
        unitPrice: "5000.00",
        stock: 32,
        imageUrl: "https://picsum.photos/300/300?random=2",
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod_3" },
      update: {},
      create: {
        id: "prod_3",
        userId: merchant.id,
        name: "Montre Classique",
        sku: "WATCH-001",
        unitPrice: "12000.00",
        stock: 8,
        imageUrl: "https://picsum.photos/300/300?random=3",
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod_4" },
      update: {},
      create: {
        id: "prod_4",
        userId: merchant.id,
        name: "Sneakers Sport",
        sku: "SHOE-001",
        unitPrice: "15000.00",
        stock: 20,
        imageUrl: "https://picsum.photos/300/300?random=4",
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ ${products.length} products created`);

  // Créer quelques clients pour le commerçant
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { 
        id: "cust_1",
      },
      update: {},
      create: {
        id: "cust_1",
        userId: merchant.id,
        fullName: "Marie Ndongo",
        phone: "+237655123456",
        email: "marie@example.com",
        address: "Douala, Cameroun",
      },
    }),
    prisma.customer.upsert({
      where: { id: "cust_2" },
      update: {},
      create: {
        id: "cust_2",
        userId: merchant.id,
        fullName: "Paul Tamo",
        phone: "+237699999999",
        email: "paul@example.com",
        address: "Yaoundé, Cameroun",
      },
    }),
    prisma.customer.upsert({
      where: { id: "cust_3" },
      update: {},
      create: {
        id: "cust_3",
        userId: merchant.id,
        fullName: "Amina Diallo",
        phone: "+221775555555",
        email: "amina@example.com",
        address: "Dakar, Sénégal",
      },
    }),
  ]);
  console.log(`✅ ${customers.length} customers created`);

  // Créer quelques commandes pour le commerçant
  const order1 = await prisma.order.upsert({
    where: { id: "order_1" },
    update: {},
    create: {
      id: "order_1",
      userId: merchant.id,
      customerId: customers[0].id,
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod: "mobile_money",
      totalAmount: "8500.00",
      paidAmount: "8500.00",
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 1,
            unitPrice: "8500.00",
            lineTotal: "8500.00",
          },
        ],
      },
    },
  });
  console.log(`✅ Order 1 created: ${order1.id}`);

  const order2 = await prisma.order.upsert({
    where: { id: "order_2" },
    update: {},
    create: {
      id: "order_2",
      userId: merchant.id,
      customerId: customers[1].id,
      status: "new",
      paymentStatus: "unpaid",
      paymentMethod: "cod",
      totalAmount: "17000.00",
      paidAmount: "0.00",
      items: {
        create: [
          {
            productId: products[1].id,
            quantity: 2,
            unitPrice: "5000.00",
            lineTotal: "10000.00",
          },
          {
            productId: products[3].id,
            quantity: 1,
            unitPrice: "15000.00",
            lineTotal: "15000.00",
          },
        ],
      },
    },
  });
  console.log(`✅ Order 2 created: ${order2.id}`);

  console.log("✨ Seeding completed successfully!");
  console.log("\n📝 Credentials de test:");
  console.log("   Email: merchant@test.local");
  console.log("   Password: Commerce123!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
