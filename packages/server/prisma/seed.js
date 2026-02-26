import { prisma } from "../config/db.js";
import { seedUsers } from "./seeds/seedUsers.js";
import { seedLobbies } from "./seeds/seedLobbies.js";
import { seedCards } from "./seeds/seedCards.js";

async function main() {
  console.log('🌱 Comprobando estado de la base de datos...');

  // 1. Ejecutar Users y guardar el resultado
  const users = await seedUsers(prisma);
  
  // 2. Ejecutar Lobbies usando los IDs de los Users creados
  await seedLobbies(prisma, users);
  
  // 3. Ejecutar el Catálogo de Cartas
  await seedCards(prisma);

  console.log('✅ Seeding finalizado correctamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });