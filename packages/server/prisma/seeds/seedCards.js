export async function seedCards(prisma) {
  const existingCards = await prisma.card.count();

  if (existingCards > 0) {
    console.log(`Se han detectado ${existingCards} cartas en el catálogo. Omitiendo creación.`);
    return;
  }

  console.log('Catálogo vacío. Insertando las cartas de la baraja...');

  const cards = [
    { nameKing: "Crier", typeKing: "Guard", descKing: "Draw 1 card, then Ready up to 1 Guard", namePeasant: "Heretic", typePeasant: "Rebel", descPeasant: "Take all Rebels from the discard pile, then Hide them", copies: 1 },
    { nameKing: "Knight", typeKing: "Guard", descKing: "Discard the top 2 cards of the deck", namePeasant: "Smuggler", typePeasant: "Rebel", descPeasant: "Shuffle all other Rebels in Town and cards in hand into the deck, then draw 3 cards", copies: 1 },
    { nameKing: "Inquisitor", typeKing: "Guard", descKing: "Ready a Guard, then Mobilize it", namePeasant: "Brawl", typePeasant: "Action", descPeasant: "Remove a Rebel and a Guard", copies: 1 },
    { nameKing: "Spy", typeKing: "Guard", descKing: "Reveal a Rebel", namePeasant: "Thug", typePeasant: "Rebel", descPeasant: "Remove a Guard, then draw 1 card", copies: 3 },
    { nameKing: "Advisor", typeKing: "Guard", descKing: "Shuffle the deck and look at the top card, you may put it on the bottom of the deck", namePeasant: "Courtesan", typePeasant: "Rebel", descPeasant: "Look at the top 3 cards of the deck, then take 1 and put the others back in any order", copies: 1 },
    { nameKing: "Noble", typeKing: "Guard", descKing: "Reveal all Rebels", namePeasant: "Mob", typePeasant: "Rebel", descPeasant: "Remove all Rebels and Guards", copies: 1 },
    { nameKing: "Guardian", typeKing: "Guard", descKing: "Look at any 1 card in the deck, if it is the ASSASSIN discard it, otherwise put it back in order", namePeasant: "Charlatan", typePeasant: "Rebel", descPeasant: "Draw up to 3 cards, then put the same number of cards on top of the deck in any order", copies: 1 },
    { nameKing: "Executor", typeKing: "Guard", descKing: "Peasant Removes 1 hidden Rebel", namePeasant: "Rat", typePeasant: "Rebel", descPeasant: "Return up to 2 other Rebels back to hand, then Hide up to 2 Rebels", copies: 1 },
    { nameKing: "Sentinel", typeKing: "Guard", descKing: "Look at the top 3 cards of the deck, then put them back in any order", namePeasant: "None", typePeasant: "None", descPeasant: "None", copies: 1 },
    { nameKing: "Strike", typeKing: "Action", descKing: "Mobilize 2 Guards", namePeasant: "Thief", typePeasant: "Rebel", descPeasant: "King discards 2 cards, then Peasant takes 1 of them", copies: 1 },
    { nameKing: "Arrest", typeKing: "Action", descKing: "Remove a Rebel or discard the top card of the deck", namePeasant: "Revolt", typePeasant: "Action", descPeasant: "Infiltrate and Dispatch all Rebels", copies: 1 },
    { nameKing: "Raid", typeKing: "Action", descKing: "Peasant discards 1 card at random", namePeasant: "Scatter", typePeasant: "Action", descPeasant: "Return all Rebels in Town back to hand, then shuffle the discard pile back into the deck", copies: 1 },
    { nameKing: "None", typeKing: "None", descKing: "-", namePeasant: "Decoy", typePeasant: "Rebel", descPeasant: "Infiltrate: Peasant removes a Guard. EXILE", copies: 1 },
    { nameKing: "Reassemble", typeKing: "Action", descKing: "Take up to 2 cards from the discard pile, then Ready up to 1 Guard", namePeasant: "Reassemble", typePeasant: "Action", descPeasant: "Draw 2 cards, then Hide up to 2 Rebels", copies: 1 },
    { nameKing: "Watchman", typeKing: "Guard", descKing: "Look at Peasant's hand cards", namePeasant: "Rally", typePeasant: "Action", descPeasant: "Draw 2 cards, then Hide up to 2 Rebels", copies: 1 },
    { nameKing: "None", typeKing: "None", descKing: "-", namePeasant: "Assassin", typePeasant: "Rebel", descPeasant: "Infiltrate: Peasant wins. Dispatch: Peasant wins if there are no Guards in Town", copies: 1 }
  ];

  for (const card of cards) {
    await prisma.card.create({ data: card });
  }

  console.log('Catálogo de cartas insertado con éxito.');
}