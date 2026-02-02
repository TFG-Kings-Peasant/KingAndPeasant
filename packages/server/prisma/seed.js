import { LobbyPrivacy, LobbyStatus } from "@prisma/client";
import { prisma } from "../config/db.js";


async function main() {
  console.log('🌱 Empezando el seeding...');

  // Borramos lobbies (que dependen de users) y luego users
  await prisma.lobby.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Datos antiguos eliminados.');

  // 2. Crear Usuarios (Necesarios para ser dueños de los lobbies)
  const user1 = await prisma.user.create({
    data: {
      name: 'ReyArturo',
      email: 'arturo@camelot.com',
      password: 'password123', // En producción deberías hashearla
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'SirLancelot',
      email: 'lancelot@camelot.com',
      password: 'password123',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Merlin',
      email: 'merlin@wizard.com',
      password: 'magic',
    },
  });


  const user4 = await prisma.user.create({
    data: {
      name: 'Galahad',
      email: 'galahad@camelot.com',
      password: 'password123',
    },
  });

    const user5 = await prisma.user.create({
    data: {
      name: 'Guille',
      email: 'guille@klk.com',
      password: 'password123', // En producción deberías hashearla
    },
  });

  console.log('👤 Usuarios creados:', [user1.name, user2.name, user3.name, user4.name, user5.name]);
  // 3. Crear Lobbies
  // Lobby 1: Creado por Arturo, esperando jugador
  await prisma.lobby.create({
    data: {
      name: 'Mesa Redonda',
      status: LobbyStatus.WAITING, // Esperando jugadores
      privacy: LobbyPrivacy.PUBLIC,
      player1Id: user1.idUser, // Arturo es el líder
      player2Id: null,         // Hueco libre
    },
  });

  // Lobby 2: Creado por Lancelot, partida llena (vs Merlin)
  await prisma.lobby.create({
    data: {
      name: 'Torneo del Castillo',
      status: LobbyStatus.ONGOING,     // Ya están jugando
      privacy: LobbyPrivacy.PRIVATE,
      player1Id: user2.idUser, // Lancelot líder
      player2Id: user3.idUser, // Merlin invitado
    },
  });

  // Lobby 3: Creado por Galahad, esperando jugador
  await prisma.lobby.create({
    data: {
      name: 'Cacería del Grial',
      status: LobbyStatus.WAITING, // Esperando jugadores
      privacy: LobbyPrivacy.PRIVATE,
      player1Id: user4.idUser, // Galahad es el líder
      player2Id: null,         // Hueco libre
    },
  });
  console.log('🏰 Lobbies creados con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });