import bcrypt from 'bcryptjs';

export async function seedUsers(prisma) {
  console.log('👤 Sincronizando Usuarios Base...');
  const password = "1234";
  const hash = await bcrypt.hash(password, 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'arturo@camelot.com' },
    update: {},
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
  
  // Devolvemos los usuarios para poder asignarlos a los lobbies
  return { user1, user2, user3, user4, user5 };
}