import { LobbyPrivacy, LobbyStatus } from "@prisma/client";
import { prisma } from "../config/db.js";
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Comprobando estado de la base de datos...');

  const password = "1234";
  const hash = await bcrypt.hash(password, 10);

  // 1. Sincronizar Usuarios Base (Usamos upsert para no duplicar ni borrar)
  const user1 = await prisma.user.upsert({
    where: { email: 'arturo@camelot.com' },
    update: {}, // Si ya existe, no hacemos nada
    create: { name: 'ReyArturo', email: 'arturo@camelot.com', password: hash },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'lancelot@camelot.com' },
    update: {},
    create: { name: 'SirLancelot', email: 'lancelot@camelot.com', password: hash },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'merlin@wizard.com' },
    update: {},
    create: { name: 'Merlin', email: 'merlin@wizard.com', password: hash },
  });

  const user4 = await prisma.user.upsert({
    where: { email: 'galahad@camelot.com' },
    update: {},
    create: { name: 'Galahad', email: 'galahad@camelot.com', password: hash },
  });

  const user5 = await prisma.user.upsert({
    where: { email: 'guille@klk.com' },
    update: {},
    create: { name: 'Guille', email: 'guille@klk.com', password: hash },
  });

  console.log('👤 Usuarios base verificados/creados.');

  // 2. Crear Lobbies SOLO si no hay ninguno en la base de datos
  // Así evitamos crear 3 lobbies infinitamente en cada reinicio
  const existingLobbies = await prisma.lobby.count();
  
  if (existingLobbies === 0) {
    console.log('🏰 Base de datos vacía de partidas. Generando Lobbies de prueba...');
    
    await prisma.lobby.create({
      data: {
        name: 'Mesa Redonda',
        status: LobbyStatus.WAITING,
        privacy: LobbyPrivacy.PUBLIC,
        player1Id: user1.idUser,
        player2Id: null,
      },
    });

    await prisma.lobby.create({
      data: {
        name: 'Torneo del Castillo',
        status: LobbyStatus.ONGOING,
        privacy: LobbyPrivacy.PRIVATE,
        player1Id: user2.idUser,
        player2Id: user3.idUser,
      },
    });

    await prisma.lobby.create({
      data: {
        name: 'Cacería del Grial',
        status: LobbyStatus.WAITING,
        privacy: LobbyPrivacy.PRIVATE,
        player1Id: user4.idUser,
        player2Id: null,
      },
    });
    
    console.log('🏰 Lobbies de prueba creados con éxito.');
  } else {
    console.log(`🏰 Se han detectado ${existingLobbies} lobbies existentes. Omitiendo creación para no duplicar.`);
  }

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