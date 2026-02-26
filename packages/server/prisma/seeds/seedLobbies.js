import { LobbyPrivacy, LobbyStatus } from "@prisma/client";

export async function seedLobbies(prisma, users) {
  const existingLobbies = await prisma.lobby.count();
  
  if (existingLobbies > 0) {
    console.log(`🏰 Se han detectado ${existingLobbies} lobbies existentes. Omitiendo creación para no duplicar.`);
    return;
  }

  console.log('🏰 Base de datos vacía de partidas. Generando Lobbies de prueba...');
  
  await prisma.lobby.create({
    data: {
      name: 'Mesa Redonda',
      status: LobbyStatus.WAITING,
      privacy: LobbyPrivacy.PUBLIC,
      player1Id: users.user1.idUser,
      player2Id: null,
    },
  });

  await prisma.lobby.create({
    data: {
      name: 'Torneo del Castillo',
      status: LobbyStatus.ONGOING,
      privacy: LobbyPrivacy.PRIVATE,
      player1Id: users.user2.idUser,
      player2Id: users.user3.idUser,
    },
  });

  await prisma.lobby.create({
    data: {
      name: 'Cacería del Grial',
      status: LobbyStatus.WAITING,
      privacy: LobbyPrivacy.PRIVATE,
      player1Id: users.user4.idUser,
      player2Id: null,
    },
  });
  
  console.log('🏰 Lobbies de prueba creados con éxito.');
}