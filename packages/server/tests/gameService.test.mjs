import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const redisStore = new Map();

const redisMock = {
  get: jest.fn(async (key) => redisStore.get(key) ?? null),
  set: jest.fn(async (key, value) => {
    redisStore.set(key, value);
    return 'OK';
  }),
  del: jest.fn(async (key) => {
    redisStore.delete(key);
    return 1;
  }),
};

const prismaMock = {
  card: {
    findMany: jest.fn(),
  },
  game: {
    create: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
};

jest.unstable_mockModule('../config/redis.js', () => ({
  redisClient: redisMock,
}));

jest.unstable_mockModule('../config/db.js', () => ({
  prisma: prismaMock,
}));

const { gameService } = await import('../src/services/GameService.js');

const makeCard = ({
  uid,
  templateId,
  typeKing = 'Action',
  typePeasant = 'Action',
  isRevealed = false,
}) => ({
  uid,
  templateId,
  typeKing,
  typePeasant,
  isRevealed,
});

const createState = (overrides = {}) => ({
  startedAt: '2026-04-22T10:00:00.000Z',
  era: 1,
  scores: { 1: 0, 2: 0 },
  turnNumber: 1,
  turn: 'peasant',
  deck: [],
  discardPile: [],
  players: {
    king: { id: 1, hand: [], town: [] },
    peasant: { id: 2, hand: [], town: [] },
  },
  pendingAction: null,
  lastEvent: null,
  ...overrides,
  players: {
    king: {
      id: 1,
      hand: [],
      town: [],
      ...(overrides.players?.king ?? {}),
    },
    peasant: {
      id: 2,
      hand: [],
      town: [],
      ...(overrides.players?.peasant ?? {}),
    },
  },
});

const saveState = async (gameId, state) => {
  await redisMock.set(`game:${gameId}`, JSON.stringify(state));
};

const expectActionError = async (promiseFactory, message) => {
  await expect(promiseFactory()).rejects.toThrow(message);
};

describe('gameService', () => {
  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
    prismaMock.card.findMany.mockResolvedValue([]);
  });

  test('startGame inicializa la partida correctamente con las reglas de King and Peasant', async () => {
    const mockCatalog = [
      { id: 1, copies: 1, typeKing: 'Guard', typePeasant: 'Rebel' },
      { id: 2, copies: 1, typeKing: 'Guard', typePeasant: 'Rebel' },
      { id: 3, copies: 1, typeKing: 'Guard', typePeasant: 'Action' },
      { id: 4, copies: 1, typeKing: 'Guard', typePeasant: 'Rebel' },
      { id: 5, copies: 1, typeKing: 'Guard', typePeasant: 'Rebel' },
      { id: 6, copies: 1, typeKing: 'Guard', typePeasant: 'Rebel' },
      { id: 7, copies: 1, typeKing: 'Guard', typePeasant: 'Rebel' },
      { id: 8, copies: 1, typeKing: 'Guard', typePeasant: 'Rebel' },
      { id: 9, copies: 1, typeKing: 'Guard', typePeasant: 'None' },
      { id: 13, copies: 1, typeKing: 'None', typePeasant: 'Rebel' },
      { id: 16, copies: 1, typeKing: 'None', typePeasant: 'Rebel' },
    ];

    prismaMock.card.findMany.mockResolvedValue(mockCatalog);

    await gameService.createGame('game-new', 1, 2);

    expect(redisMock.set).toHaveBeenCalledWith('game:game-new', expect.any(String));

    const savedStateStr = redisStore.get('game:game-new');
    const initialState = JSON.parse(savedStateStr);

    expect(initialState.era).toBe(1);
    expect(initialState.turnNumber).toBe(1);
    expect(initialState.turn).toBe('peasant');
    expect(initialState.discardPile).toHaveLength(0);
    expect(initialState.pendingAction).toBeNull();
    expect(initialState.players.king.id).toBe(1);
    expect(initialState.players.peasant.id).toBe(2);
    expect(initialState.players.king.hand).toHaveLength(5);
    expect(initialState.players.peasant.hand).toHaveLength(5);

    const kingHasSentinel = initialState.players.king.hand.some(c => c.templateId === 9);
    const peasantHasAssassin = initialState.players.peasant.hand.some(c => c.templateId === 16);
    const peasantHasDecoy = initialState.players.peasant.hand.some(c => c.templateId === 13);

    expect(kingHasSentinel).toBe(true);
    expect(peasantHasAssassin).toBe(true);
    expect(peasantHasDecoy).toBe(true);
    expect(initialState.deck).toHaveLength(1);
  });

  test('playHandCard oculta un rebelde del campesino en el pueblo y devuelve el estado esperado', async () => {
    const hiddenRebel = makeCard({
      uid: 'rebel-1',
      templateId: 4,
      typePeasant: 'Rebel',
    });
    const fillerDeckCard = makeCard({
      uid: 'deck-safe-1',
      templateId: 99,
    });

    await saveState('game-hide', createState({
      turn: 'peasant',
      deck: [fillerDeckCard],
      players: {
        peasant: {
          hand: [hiddenRebel],
        },
      },
    }));

    const result = await gameService.playHandCard('game-hide', 'rebel-1', {}, 2);

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.players.peasant.hand).toEqual([]);
    expect(result.dtoPeasant.players.peasant.town).toEqual([
      expect.objectContaining({
        uid: 'rebel-1',
        templateId: 4,
        typePeasant: 'Rebel',
        isRevealed: false,
      }),
    ]);
    expect(result.dtoKing.players.peasant.town).toEqual([{ uid: 'rebel-1' }]);
  });

  test('playTownCard devuelve un rebelde revelado a la mano del campesino boca abajo', async () => {
    const revealedRebel = makeCard({
      uid: 'rebel-2',
      templateId: 5,
      typePeasant: 'Rebel',
      isRevealed: true,
    });
    const fillerDeckCard = makeCard({
      uid: 'deck-safe-2',
      templateId: 99,
    });

    await saveState('game-return', createState({
      turn: 'peasant',
      deck: [fillerDeckCard],
      players: {
        peasant: {
          town: [revealedRebel],
        },
      },
    }));

    const result = await gameService.playTownCard('game-return', 'rebel-2', {}, 2);

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.players.peasant.town).toEqual([]);
    expect(result.dtoPeasant.players.peasant.hand).toEqual([
      expect.objectContaining({
        uid: 'rebel-2',
        templateId: 5,
        isRevealed: false,
      }),
    ]);
    expect(result.dtoKing.players.peasant.hand).toEqual([{ uid: 'rebel-2' }]);
  });

  test('playHandCard con Strike deja la accion pendiente y manda la carta de accion al descarte', async () => {
    const strike = makeCard({ uid: 'strike-1', templateId: 10, typeKing: 'Action' });
    const guard1 = makeCard({
      uid: 'guard-1',
      templateId: 2,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const guard2 = makeCard({
      uid: 'guard-2',
      templateId: 2,
      typeKing: 'Guard',
      isRevealed: true,
    });

    await saveState('game-strike', createState({
      turn: 'king',
      players: {
        king: {
          hand: [strike],
          town: [guard1, guard2],
        },
      },
    }));

    const result = await gameService.playHandCard('game-strike', 'strike-1', {}, 1);

    expect(result.dtoKing.turn).toBe('king');
    expect(result.dtoKing.pendingAction).toEqual({
      player: 'king',
      type: 'STRIKE',
    });
    expect(result.dtoKing.players.king.hand).toEqual([]);
    expect(result.dtoKing.discardPile).toEqual([
      expect.objectContaining({
        uid: 'strike-1',
        templateId: 10,
        isRevealed: true,
      }),
    ]);
  });

  test('resolvePendingAction de Strike moviliza dos guardias y aplica sus efectos', async () => {
    const deckCard1 = makeCard({
      uid: 'strike-deck-1',
      templateId: 21,
      typeKing: 'Action',
    });
    const deckCard2 = makeCard({
      uid: 'strike-deck-2',
      templateId: 22,
      typeKing: 'Action',
    });
    const deckCard3 = makeCard({
      uid: 'strike-deck-3',
      templateId: 23,
      typeKing: 'Action',
    });
    const deckCard4 = makeCard({
      uid: 'strike-deck-4',
      templateId: 24,
      typeKing: 'Action',
    });
    const drawCard = makeCard({
      uid: 'strike-draw',
      templateId: 25,
      typeKing: 'Action',
    });
    const guard1 = makeCard({
      uid: 'guard-a',
      templateId: 2,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const guard2 = makeCard({
      uid: 'guard-b',
      templateId: 2,
      typeKing: 'Guard',
      isRevealed: true,
    });

    await saveState('game-resolve-strike', createState({
      turn: 'king',
      deck: [drawCard, deckCard4, deckCard3, deckCard2, deckCard1],
      pendingAction: {
        player: 'king',
        type: 'STRIKE',
      },
      players: {
        king: {
          town: [guard1, guard2],
        },
      },
    }));

    const result = await gameService.resolvePendingAction('game-resolve-strike', 1, {
      guardUid1: 'guard-a',
      guardUid2: 'guard-b',
    });

    expect(result.dtoKing.turn).toBe('peasant');
    expect(result.dtoKing.pendingAction).toBeNull();
    expect(result.dtoKing.players.king.town).toEqual([]);
    expect(result.dtoKing.players.king.hand).toEqual([]);
    expect(result.dtoKing.discardPile).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'strike-deck-1', isRevealed: true }),
      expect.objectContaining({ uid: 'strike-deck-2', isRevealed: true }),
      expect.objectContaining({ uid: 'strike-deck-3', isRevealed: true }),
      expect.objectContaining({ uid: 'strike-deck-4', isRevealed: true }),
      expect.objectContaining({ uid: 'guard-a', isRevealed: true }),
      expect.objectContaining({ uid: 'guard-b', isRevealed: true }),
    ]));
    expect(result.dtoKing.discardPile).toHaveLength(6);
  });

  test('resolvePendingAction de Strike conserva el segundo guardia si el primero abre una accion pendiente', async () => {
    const spyGuard = makeCard({
      uid: 'strike-spy',
      templateId: 4,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const millGuard = makeCard({
      uid: 'strike-mill',
      templateId: 2,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const hiddenRebel = makeCard({
      uid: 'strike-hidden-rebel',
      templateId: 5,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const deckCard1 = makeCard({ uid: 'strike-queued-1', templateId: 31 });
    const deckCard2 = makeCard({ uid: 'strike-queued-2', templateId: 32 });
    const drawCard = makeCard({ uid: 'strike-queued-draw', templateId: 33, typeKing: 'Action' });

    await saveState('game-strike-chain', createState({
      turn: 'king',
      deck: [drawCard, deckCard2, deckCard1],
      pendingAction: {
        player: 'king',
        type: 'STRIKE',
      },
      players: {
        king: {
          town: [spyGuard, millGuard],
        },
        peasant: {
          town: [hiddenRebel],
        },
      },
    }));

    const step1 = await gameService.resolvePendingAction('game-strike-chain', 1, {
      guardUid1: 'strike-spy',
      guardUid2: 'strike-mill',
    });

    expect(step1.dtoKing.turn).toBe('king');
    expect(step1.dtoKing.pendingAction).toEqual({
      player: 'king',
      type: 'SPY',
    });

    const result = await gameService.resolvePendingAction('game-strike-chain', 1, {
      targetUid: 'strike-hidden-rebel',
    });

    expect(result.dtoKing.turn).toBe('peasant');
    expect(result.dtoKing.pendingAction).toBeNull();
    expect(result.dtoKing.players.peasant.town).toEqual([
      expect.objectContaining({ uid: 'strike-hidden-rebel', isRevealed: false, seenByKing: true }),
    ]);
    expect(result.dtoKing.discardPile).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'strike-spy', isRevealed: true }),
      expect.objectContaining({ uid: 'strike-mill', isRevealed: true }),
      expect.objectContaining({ uid: 'strike-queued-1', isRevealed: true }),
      expect.objectContaining({ uid: 'strike-queued-2', isRevealed: true }),
    ]));
    expect(result.dtoKing.players.king.hand).toEqual([]);
  });

  test('playHandCard con Rally roba dos cartas y deja la seleccion de ocultarlas como accion pendiente', async () => {
    const rally = makeCard({ uid: 'rally-1', templateId: 15, typePeasant: 'Action' });
    const deckCard1 = makeCard({ uid: 'deck-1', templateId: 4, typePeasant: 'Rebel' });
    const deckCard2 = makeCard({ uid: 'deck-2', templateId: 6, typePeasant: 'Rebel' });

    await saveState('game-rally', createState({
      turn: 'peasant',
      deck: [deckCard1, deckCard2],
      players: {
        peasant: {
          hand: [rally],
        },
      },
    }));

    const result = await gameService.playHandCard('game-rally', 'rally-1', {}, 2);

    expect(result.dtoPeasant.turn).toBe('peasant');
    expect(result.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'RALLY',
    });
    expect(result.dtoPeasant.players.peasant.hand).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'deck-1', templateId: 4 }),
      expect.objectContaining({ uid: 'deck-2', templateId: 6 }),
    ]));
    expect(result.dtoPeasant.players.peasant.hand).toHaveLength(2);
    expect(result.dtoPeasant.discardPile).toEqual([
      expect.objectContaining({ uid: 'rally-1', templateId: 15, isRevealed: true }),
    ]);
  });

  test('resolvePendingAction de Rally mueve las cartas elegidas al pueblo ocultas y cede el turno', async () => {
    const drawn1 = makeCard({ uid: 'draw-r1', templateId: 4, typePeasant: 'Rebel' });
    const drawn2 = makeCard({ uid: 'draw-r2', templateId: 8, typePeasant: 'Rebel' });
    const fillerDeckCard = makeCard({ uid: 'deck-safe-3', templateId: 99 });

    await saveState('game-rally-resolve', createState({
      turn: 'peasant',
      deck: [fillerDeckCard],
      pendingAction: {
        player: 'peasant',
        type: 'RALLY',
      },
      players: {
        peasant: {
          hand: [drawn1, drawn2],
        },
      },
    }));

    const result = await gameService.resolvePendingAction('game-rally-resolve', 2, {
      selectedCardsUid: ['draw-r1', 'draw-r2'],
    });

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.pendingAction).toBeNull();
    expect(result.dtoPeasant.players.peasant.hand).toEqual([]);
    expect(result.dtoPeasant.players.peasant.town).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'draw-r1', isRevealed: false }),
      expect.objectContaining({ uid: 'draw-r2', isRevealed: false }),
    ]));
    expect(result.dtoKing.players.peasant.town).toEqual([
      { uid: 'draw-r1' },
      { uid: 'draw-r2' },
    ]);
  });

  test('Arrest desde mano permite descartar un rebelde del pueblo y deja el estado esperado', async () => {
    const arrest = makeCard({ uid: 'arrest-1', templateId: 11, typeKing: 'Action' });
    const targetRebel = makeCard({
      uid: 'peasant-town-1',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const drawAfterResolve = makeCard({
      uid: 'king-draw-after-arrest',
      templateId: 99,
      typeKing: 'Action',
    });

    await saveState('game-arrest', createState({
      turn: 'king',
      deck: [drawAfterResolve],
      players: {
        king: {
          hand: [arrest],
        },
        peasant: {
          town: [targetRebel],
        },
      },
    }));

    const pendingResult = await gameService.playHandCard('game-arrest', 'arrest-1', {}, 1);
    expect(pendingResult.dtoKing.pendingAction).toEqual({
      player: 'king',
      type: 'ARREST',
    });

    const result = await gameService.resolvePendingAction('game-arrest', 1, {
      option: 'TOWN',
      targetUid: 'peasant-town-1',
    });

    expect(result.dtoKing.turn).toBe('peasant');
    expect(result.dtoKing.pendingAction).toBeNull();
    expect(result.dtoKing.players.king.hand).toEqual([]);
    expect(result.dtoKing.players.peasant.town).toEqual([]);
    expect(result.dtoKing.discardPile).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'arrest-1', templateId: 11, isRevealed: true }),
      expect.objectContaining({ uid: 'peasant-town-1', templateId: 4, isRevealed: true }),
    ]));
  });

  test('Brawl elimina un rebelde y un guardia al resolverse', async () => {
    const brawl = makeCard({ uid: 'brawl-1', templateId: 3, typePeasant: 'Action' });
    const rebel = makeCard({
      uid: 'brawl-rebel',
      templateId: 5,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const guard = makeCard({
      uid: 'brawl-guard',
      templateId: 1,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const fillerDeckCard = makeCard({ uid: 'brawl-deck', templateId: 99 });

    await saveState('game-brawl', createState({
      turn: 'peasant',
      deck: [fillerDeckCard],
      players: {
        peasant: {
          hand: [brawl],
          town: [rebel],
        },
        king: {
          town: [guard],
        },
      },
    }));

    const pendingResult = await gameService.playHandCard('game-brawl', 'brawl-1', {}, 2);
    expect(pendingResult.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'BRAWL',
    });

    const result = await gameService.resolvePendingAction('game-brawl', 2, {
      rebelUid: 'brawl-rebel',
      guardUid: 'brawl-guard',
    });

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.players.peasant.town).toEqual([]);
    expect(result.dtoPeasant.players.king.town).toEqual([]);
    expect(result.dtoPeasant.discardPile).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'brawl-1', templateId: 3, isRevealed: true }),
      expect.objectContaining({ uid: 'brawl-rebel', isRevealed: true }),
      expect.objectContaining({ uid: 'brawl-guard', isRevealed: true }),
    ]));
  });

  test('Thug elimina un guardia y roba una carta para el campesino', async () => {
    const thug = makeCard({
      uid: 'thug-1',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const guard = makeCard({
      uid: 'thug-guard',
      templateId: 7,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const drawCard = makeCard({
      uid: 'thug-draw',
      templateId: 8,
      typePeasant: 'Rebel',
    });
    const fillerDeckCard = makeCard({
      uid: 'thug-filler',
      templateId: 99,
    });

    await saveState('game-thug', createState({
      turn: 'peasant',
      deck: [fillerDeckCard, drawCard],
      players: {
        peasant: {
          town: [thug],
        },
        king: {
          town: [guard],
        },
      },
    }));

    const pendingResult = await gameService.playTownCard('game-thug', 'thug-1', {}, 2);
    expect(pendingResult.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'THUG',
    });
    expect(pendingResult.dtoPeasant.players.peasant.town).toEqual([
      expect.objectContaining({ uid: 'thug-1', isRevealed: true }),
    ]);

    const result = await gameService.resolvePendingAction('game-thug', 2, {
      targetUid: 'thug-guard',
    });

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.players.peasant.hand).toEqual([
      expect.objectContaining({ uid: 'thug-draw', templateId: 8 }),
    ]);
    expect(result.dtoPeasant.players.king.town).toEqual([]);
    expect(result.dtoPeasant.discardPile).toEqual([
      expect.objectContaining({ uid: 'thug-guard', isRevealed: true }),
    ]);
  });

  test('Spy deja al rey ver un rebelde oculto sin revelarlo publicamente', async () => {
    const spy = makeCard({
      uid: 'spy-1',
      templateId: 4,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const hiddenRebel = makeCard({
      uid: 'spy-target',
      templateId: 5,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const drawCard = makeCard({
      uid: 'spy-draw',
      templateId: 99,
      typeKing: 'Action',
    });

    await saveState('game-spy', createState({
      turn: 'king',
      deck: [drawCard],
      players: {
        king: {
          town: [spy],
        },
        peasant: {
          town: [hiddenRebel],
        },
      },
    }));

    const pendingResult = await gameService.playTownCard('game-spy', 'spy-1', {}, 1);
    expect(pendingResult.dtoKing.pendingAction).toEqual({
      player: 'king',
      type: 'SPY',
    });

    const result = await gameService.resolvePendingAction('game-spy', 1, {
      targetUid: 'spy-target',
    });

    expect(result.dtoKing.turn).toBe('peasant');
    expect(result.dtoKing.players.peasant.town).toEqual([
      expect.objectContaining({ uid: 'spy-target', isRevealed: false, seenByKing: true }),
    ]);
    expect(result.dtoPeasant.players.peasant.town).toEqual([
      expect.objectContaining({ uid: 'spy-target', isRevealed: false, seenByKing: true }),
    ]);
  });

  test('Guardian revela al Assassin en el mazo y cierra la partida a favor del rey', async () => {
    prismaMock.game.create.mockResolvedValue({ idGame: 2 });
    prismaMock.user.update.mockResolvedValue({});

    const guardian = makeCard({
      uid: 'guardian-1',
      templateId: 7,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const assassin = makeCard({
      uid: 'guardian-assassin',
      templateId: 16,
      typePeasant: 'Rebel',
    });

    await saveState('game-guardian', createState({
      turn: 'king',
      scores: { 1: 1, 2: 0 },
      deck: [assassin],
      players: {
        king: {
          town: [guardian],
        },
      },
    }));

    const pendingResult = await gameService.playTownCard('game-guardian', 'guardian-1', {}, 1);
    expect(pendingResult.dtoKing.pendingAction).toEqual({
      player: 'king',
      type: 'GUARDIAN',
    });

    const result = await gameService.resolvePendingAction('game-guardian', 1, {
      targetUid: 'guardian-assassin',
    });

    expect(result).toEqual({
      isGameOver: true,
      winnerId: 1,
      reason: 'ASSASSIN_EXPOSED',
    });
    expect(prismaMock.game.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.update).toHaveBeenCalledTimes(2);
  });

  test('un Decoy infiltrado en la mano del rey fuerza una accion pendiente del campesino', async () => {
    const decoy = makeCard({
      uid: 'forced-decoy',
      templateId: 13,
      typePeasant: 'Rebel',
    });
    const guard = makeCard({
      uid: 'forced-decoy-guard',
      templateId: 1,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const drawCard = makeCard({
      uid: 'forced-decoy-draw',
      templateId: 99,
      typeKing: 'Action',
    });

    await saveState('game-decoy-trigger', createState({
      turn: 'king',
      deck: [drawCard],
      players: {
        king: {
          hand: [decoy],
          town: [guard],
        },
      },
    }));

    const result = await gameService.passTurn('game-decoy-trigger', 1);

    expect(result.dtoKing.turn).toBe('peasant');
    expect(result.dtoKing.pendingAction).toEqual({
      player: 'peasant',
      type: 'DECOY',
    });
    expect(result.dtoKing.players.king.hand).toEqual([
      expect.objectContaining({ uid: 'forced-decoy-draw' }),
    ]);
  });

  test('resolver DECOY elimina un guardia y devuelve el turno al rey', async () => {
    const guard = makeCard({
      uid: 'decoy-guard',
      templateId: 7,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const fillerDeckCard = makeCard({
      uid: 'decoy-deck',
      templateId: 99,
    });

    await saveState('game-decoy-resolve', createState({
      turn: 'peasant',
      deck: [fillerDeckCard],
      pendingAction: {
        player: 'peasant',
        type: 'DECOY',
      },
      players: {
        king: {
          town: [guard],
        },
      },
    }));

    const result = await gameService.resolvePendingAction('game-decoy-resolve', 2, {
      targetUid: 'decoy-guard',
    });

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.pendingAction).toBeNull();
    expect(result.dtoPeasant.players.king.town).toEqual([]);
    expect(result.dtoPeasant.discardPile).toEqual([
      expect.objectContaining({ uid: 'decoy-guard', isRevealed: true }),
    ]);
  });

  test('Reassemble del campesino recupera descarte y luego oculta un rebelde en el pueblo', async () => {
    const reassemble = makeCard({
      uid: 'peasant-reassemble',
      templateId: 14,
      typePeasant: 'Action',
    });
    const discardRebel = makeCard({
      uid: 'peasant-discard-rebel',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: true,
    });
    const discardAction = makeCard({
      uid: 'peasant-discard-action',
      templateId: 15,
      typePeasant: 'Action',
      isRevealed: true,
    });
    const fillerDeckCard = makeCard({
      uid: 'peasant-reassemble-deck',
      templateId: 99,
    });

    await saveState('game-peasant-reassemble', createState({
      turn: 'peasant',
      deck: [fillerDeckCard],
      discardPile: [discardRebel, discardAction],
      players: {
        peasant: {
          hand: [reassemble],
        },
      },
    }));

    const pendingResult = await gameService.playHandCard('game-peasant-reassemble', 'peasant-reassemble', {}, 2);
    expect(pendingResult.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'REASSEMBLE1',
    });

    const step1 = await gameService.resolvePendingAction('game-peasant-reassemble', 2, {
      discardUids: ['peasant-discard-rebel', 'peasant-discard-action'],
    });
    expect(step1.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'REASSEMBLE2',
    });
    expect(step1.dtoPeasant.players.peasant.hand).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'peasant-discard-rebel', isRevealed: false }),
      expect.objectContaining({ uid: 'peasant-discard-action', isRevealed: false }),
    ]));

    const result = await gameService.resolvePendingAction('game-peasant-reassemble', 2, {
      rebelUid: 'peasant-discard-rebel',
    });

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.pendingAction).toBeNull();
    expect(result.dtoPeasant.players.peasant.town).toEqual([
      expect.objectContaining({ uid: 'peasant-discard-rebel', isRevealed: false }),
    ]);
    expect(result.dtoPeasant.players.peasant.hand).toEqual([
      expect.objectContaining({ uid: 'peasant-discard-action', isRevealed: false }),
    ]);
  });

  test('Reassemble del rey recupera descarte y despliega un guardia en el pueblo', async () => {
    const reassemble = makeCard({
      uid: 'king-reassemble',
      templateId: 14,
      typeKing: 'Action',
    });
    const discardGuard = makeCard({
      uid: 'king-discard-guard',
      templateId: 7,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const fillerDeckCard = makeCard({
      uid: 'king-reassemble-deck',
      templateId: 99,
      typeKing: 'Action',
    });

    await saveState('game-king-reassemble', createState({
      turn: 'king',
      deck: [fillerDeckCard],
      discardPile: [discardGuard],
      players: {
        king: {
          hand: [reassemble],
        },
      },
    }));

    const pendingResult = await gameService.playHandCard('game-king-reassemble', 'king-reassemble', {}, 1);
    expect(pendingResult.dtoKing.pendingAction).toEqual({
      player: 'king',
      type: 'REASSEMBLE1',
    });

    const step1 = await gameService.resolvePendingAction('game-king-reassemble', 1, {
      discardUids: ['king-discard-guard'],
    });
    expect(step1.dtoKing.pendingAction).toEqual({
      player: 'king',
      type: 'REASSEMBLE2',
    });
    expect(step1.dtoKing.players.king.hand).toEqual([
      expect.objectContaining({ uid: 'king-discard-guard', isRevealed: false }),
    ]);

    const result = await gameService.resolvePendingAction('game-king-reassemble', 1, {
      guardUid: 'king-discard-guard',
    });

    expect(result.dtoKing.turn).toBe('peasant');
    expect(result.dtoKing.pendingAction).toBeNull();
    expect(result.dtoKing.players.king.town).toEqual([
      expect.objectContaining({ uid: 'king-discard-guard', isRevealed: true }),
    ]);
    expect(result.dtoKing.players.king.hand).toEqual([]);
  });

  test('Revolt inserta rebeldes en el mazo y revela el resto del pueblo', async () => {
    const revolt = makeCard({
      uid: 'revolt-1',
      templateId: 11,
      typePeasant: 'Action',
    });
    const hiddenToDeck = makeCard({
      uid: 'revolt-hidden',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const staysInTown = makeCard({
      uid: 'revolt-stays',
      templateId: 8,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const deckBase = makeCard({
      uid: 'revolt-deck-base',
      templateId: 99,
    });

    await saveState('game-revolt', createState({
      turn: 'peasant',
      deck: [deckBase],
      players: {
        peasant: {
          hand: [revolt],
          town: [hiddenToDeck, staysInTown],
        },
      },
    }));

    const pendingResult = await gameService.playHandCard('game-revolt', 'revolt-1', {}, 2);
    expect(pendingResult.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'REVOLT',
    });

    const result = await gameService.resolvePendingAction('game-revolt', 2, {
      rebelUids: ['revolt-hidden'],
      deckPositions: [0],
    });

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.pendingAction).toBeNull();
    expect(result.dtoPeasant.players.peasant.town).toEqual([
      expect.objectContaining({ uid: 'revolt-stays', isRevealed: true }),
    ]);
    expect(result.dtoPeasant.deck).toEqual([
      { uid: 'revolt-hidden' },
      { uid: 'revolt-deck-base' },
    ]);
  });

  test('Courtesan toma una carta del mazo y deja las demas ocultas', async () => {
    const courtesan = makeCard({
      uid: 'courtesan-1',
      templateId: 5,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const deck1 = makeCard({ uid: 'court-deck-1', templateId: 1, isRevealed: false });
    const deck2 = makeCard({ uid: 'court-deck-2', templateId: 2, isRevealed: false });
    const deck3 = makeCard({ uid: 'court-deck-3', templateId: 3, isRevealed: false });
    const fillerDeck = makeCard({ uid: 'court-deck-4', templateId: 99, isRevealed: false });

    await saveState('game-courtesan', createState({
      turn: 'peasant',
      deck: [fillerDeck, deck1, deck2, deck3],
      players: {
        peasant: {
          town: [courtesan],
        },
      },
    }));

    const pendingResult = await gameService.playTownCard('game-courtesan', 'courtesan-1', {}, 2);
    expect(pendingResult.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'COURTESAN',
    });

    const result = await gameService.resolvePendingAction('game-courtesan', 2, {
      targetUid: 'court-deck-2',
    });

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.players.peasant.hand).toEqual([
      expect.objectContaining({ uid: 'court-deck-2' }),
    ]);
    expect(result.dtoPeasant.deck).toEqual([
      { uid: 'court-deck-4' },
      { uid: 'court-deck-1' },
      { uid: 'court-deck-3' },
    ]);
  });

  test('Charlatan roba cartas y luego obliga a devolver el mismo numero al mazo', async () => {
    const charlatan = makeCard({
      uid: 'charlatan-1',
      templateId: 7,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const deck1 = makeCard({ uid: 'char-deck-1', templateId: 1 });
    const deck2 = makeCard({ uid: 'char-deck-2', templateId: 2 });
    const deck3 = makeCard({ uid: 'char-deck-3', templateId: 3 });

    await saveState('game-charlatan', createState({
      turn: 'peasant',
      deck: [deck1, deck2, deck3],
      players: {
        peasant: {
          town: [charlatan],
        },
      },
    }));

    const pendingResult = await gameService.playTownCard('game-charlatan', 'charlatan-1', {}, 2);
    expect(pendingResult.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'CHARLATAN',
      amount: 3,
    });

    const step1 = await gameService.resolvePendingAction('game-charlatan', 2, {
      amountToDraw: 2,
    });
    expect(step1.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'CHARLATAN2',
      amount: 2,
    });
    expect(step1.dtoPeasant.players.peasant.hand).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'char-deck-3' }),
      expect.objectContaining({ uid: 'char-deck-2' }),
    ]));

    const result = await gameService.resolvePendingAction('game-charlatan', 2, {
      handUids: ['char-deck-3', 'char-deck-2'],
    });

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.players.peasant.hand).toEqual([]);
    expect(result.dtoPeasant.deck).toEqual([
      { uid: 'char-deck-1' },
      { uid: 'char-deck-3' },
      { uid: 'char-deck-2' },
    ]);
  });

  test('Rat devuelve rebeldes a la mano y luego vuelve a ocultarlos en el pueblo', async () => {
    const rat = makeCard({
      uid: 'rat-1',
      templateId: 8,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const townRebel1 = makeCard({
      uid: 'rat-town-1',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: true,
    });
    const townRebel2 = makeCard({
      uid: 'rat-town-2',
      templateId: 5,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const fillerDeckCard = makeCard({
      uid: 'rat-deck',
      templateId: 99,
    });

    await saveState('game-rat', createState({
      turn: 'peasant',
      deck: [fillerDeckCard],
      players: {
        peasant: {
          town: [rat, townRebel1, townRebel2],
        },
      },
    }));

    const pendingResult = await gameService.playTownCard('game-rat', 'rat-1', {}, 2);
    expect(pendingResult.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'RAT',
    });

    const step1 = await gameService.resolvePendingAction('game-rat', 2, {
      townUids: ['rat-town-1', 'rat-town-2'],
    });
    expect(step1.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'RAT2',
    });
    expect(step1.dtoPeasant.players.peasant.hand).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'rat-town-1' }),
      expect.objectContaining({ uid: 'rat-town-2' }),
    ]));

    const result = await gameService.resolvePendingAction('game-rat', 2, {
      handUids: ['rat-town-1'],
    });

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.players.peasant.town).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'rat-1', isRevealed: true }),
      expect.objectContaining({ uid: 'rat-town-1', isRevealed: false }),
    ]));
    expect(result.dtoPeasant.players.peasant.hand).toEqual([
      expect.objectContaining({ uid: 'rat-town-2' }),
    ]);
  });

  test('Watchman revela la mano del campesino y al resolverse la vuelve a ocultar', async () => {
    const watchman = makeCard({
      uid: 'watchman-1',
      templateId: 15,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const peasantCard1 = makeCard({
      uid: 'watch-hand-1',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const peasantCard2 = makeCard({
      uid: 'watch-hand-2',
      templateId: 11,
      typePeasant: 'Action',
      isRevealed: false,
    });
    const drawCard = makeCard({
      uid: 'watchman-draw',
      templateId: 99,
      typeKing: 'Action',
    });

    await saveState('game-watchman', createState({
      turn: 'king',
      deck: [drawCard],
      players: {
        king: {
          town: [watchman],
        },
        peasant: {
          hand: [peasantCard1, peasantCard2],
        },
      },
    }));

    const pendingResult = await gameService.playTownCard('game-watchman', 'watchman-1', {}, 1);
    expect(pendingResult.dtoKing.pendingAction).toEqual({
      player: 'king',
      type: 'WATCHMAN',
    });
    expect(pendingResult.dtoKing.players.peasant.hand).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'watch-hand-1', isRevealed: true }),
      expect.objectContaining({ uid: 'watch-hand-2', isRevealed: true }),
    ]));

    const result = await gameService.resolvePendingAction('game-watchman', 1, {});

    expect(result.dtoKing.turn).toBe('peasant');
    expect(result.dtoKing.players.king.hand).toEqual([]);
    expect(result.dtoKing.players.peasant.hand).toEqual([
      { uid: 'watch-hand-1' },
      { uid: 'watch-hand-2' },
    ]);
  });

  test('Crier roba una carta y permite bajar un guardia', async () => {
    const crier = makeCard({
      uid: 'crier-1',
      templateId: 1,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const guardInHand = makeCard({
      uid: 'crier-guard',
      templateId: 7,
      typeKing: 'Guard',
      isRevealed: false,
    });
    const draw1 = makeCard({ uid: 'crier-draw-1', templateId: 99, typeKing: 'Action' });
    const draw2 = makeCard({ uid: 'crier-draw-2', templateId: 98, typeKing: 'Action' });

    await saveState('game-crier', createState({
      turn: 'king',
      deck: [draw2, draw1],
      players: {
        king: {
          town: [crier],
          hand: [guardInHand],
        },
      },
    }));

    const pendingResult = await gameService.playTownCard('game-crier', 'crier-1', {}, 1);
    expect(pendingResult.dtoKing.pendingAction).toEqual({
      player: 'king',
      type: 'CRIER',
    });
    expect(pendingResult.dtoKing.players.king.hand).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'crier-guard' }),
      expect.objectContaining({ uid: 'crier-draw-1' }),
    ]));

    const result = await gameService.resolvePendingAction('game-crier', 1, {
      targetUid: 'crier-guard',
    });

    expect(result.dtoKing.turn).toBe('peasant');
    expect(result.dtoKing.pendingAction).toBeNull();
    expect(result.dtoKing.players.king.town).toEqual([
      expect.objectContaining({ uid: 'crier-guard', isRevealed: true }),
    ]);
    expect(result.dtoKing.players.king.hand).toEqual([
      expect.objectContaining({ uid: 'crier-draw-1' }),
    ]);
  });

  test('Inquisitor moviliza un guardia de la mano y activa su efecto', async () => {
    const inquisitor = makeCard({
      uid: 'inquisitor-1',
      templateId: 3,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const spyGuard = makeCard({
      uid: 'inquisitor-spy',
      templateId: 4,
      typeKing: 'Guard',
      isRevealed: false,
    });
    const hiddenRebel = makeCard({
      uid: 'inquisitor-target',
      templateId: 5,
      typePeasant: 'Rebel',
      isRevealed: false,
    });

    await saveState('game-inquisitor', createState({
      turn: 'king',
      players: {
        king: {
          town: [inquisitor],
          hand: [spyGuard],
        },
        peasant: {
          town: [hiddenRebel],
        },
      },
    }));

    const pendingResult = await gameService.playTownCard('game-inquisitor', 'inquisitor-1', {}, 1);
    expect(pendingResult.dtoKing.pendingAction).toEqual({
      player: 'king',
      type: 'INQUISITOR',
    });

    const result = await gameService.resolvePendingAction('game-inquisitor', 1, {
      targetUid: 'inquisitor-spy',
    });

    expect(result.dtoKing.turn).toBe('king');
    expect(result.dtoKing.pendingAction).toEqual({
      player: 'king',
      type: 'SPY',
    });
    expect(result.dtoKing.players.king.town).toEqual([]);
    expect(result.dtoKing.players.peasant.town).toEqual([{ uid: 'inquisitor-target' }]);
  });

  test('Advisor puede mover la carta superior al fondo y termina ocultando el mazo', async () => {
    const advisor = makeCard({
      uid: 'advisor-1',
      templateId: 5,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const deckA = makeCard({ uid: 'advisor-a', templateId: 1 });
    const deckB = makeCard({ uid: 'advisor-b', templateId: 2 });
    const originalRandom = Math.random;
    Math.random = () => 0.999999;

    try {
      await saveState('game-advisor', createState({
        turn: 'king',
        deck: [deckA, deckB],
        players: {
          king: {
            town: [advisor],
          },
        },
      }));

      const pendingResult = await gameService.playTownCard('game-advisor', 'advisor-1', {}, 1);
      expect(pendingResult.dtoKing.pendingAction).toEqual({
        player: 'king',
        type: 'ADVISOR',
      });
      expect(pendingResult.dtoKing.deck).toEqual([
        { uid: 'advisor-a' },
        expect.objectContaining({ uid: 'advisor-b', isRevealed: true }),
      ]);

      const result = await gameService.resolvePendingAction('game-advisor', 1, {
        bottom: true,
      });

      expect(result.dtoKing.turn).toBe('peasant');
      expect(result.dtoKing.pendingAction).toBeNull();
      expect(result.dtoKing.players.king.hand).toEqual([]);
      expect(result.dtoKing.deck).toEqual([
        { uid: 'advisor-b' },
        { uid: 'advisor-a' },
      ]);
    } finally {
      Math.random = originalRandom;
    }
  });

  test('Sentinel revela tres cartas y permite reordenarlas', async () => {
    const sentinel = makeCard({
      uid: 'sentinel-1',
      templateId: 9,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const deck1 = makeCard({ uid: 'sentinel-a', templateId: 1 });
    const deck2 = makeCard({ uid: 'sentinel-b', templateId: 2 });
    const deck3 = makeCard({ uid: 'sentinel-c', templateId: 3 });

    await saveState('game-sentinel', createState({
      turn: 'king',
      deck: [deck1, deck2, deck3],
      players: {
        king: {
          town: [sentinel],
        },
      },
    }));

    const pendingResult = await gameService.playTownCard('game-sentinel', 'sentinel-1', {}, 1);
    expect(pendingResult.dtoKing.pendingAction).toEqual({
      player: 'king',
      type: 'SENTINEL',
    });
    expect(pendingResult.dtoKing.discardPile).toEqual([]);

    const result = await gameService.resolvePendingAction('game-sentinel', 1, {
      selectedUids: ['sentinel-b', 'sentinel-c', 'sentinel-a'],
    });

    expect(result.dtoKing.turn).toBe('peasant');
    expect(result.dtoKing.deck).toEqual([
      { uid: 'sentinel-b' },
      { uid: 'sentinel-c' },
      { uid: 'sentinel-a' },
    ]);
  });

  test('Executor pasa el turno al campesino y obliga a eliminar un rebelde oculto', async () => {
    const executor = makeCard({
      uid: 'executor-1',
      templateId: 8,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const hiddenRebel = makeCard({
      uid: 'executor-target',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const fillerDeckCard = makeCard({
      uid: 'executor-deck',
      templateId: 99,
    });

    await saveState('game-executor', createState({
      turn: 'king',
      deck: [fillerDeckCard],
      players: {
        king: {
          town: [executor],
        },
        peasant: {
          town: [hiddenRebel],
        },
      },
    }));

    const pendingResult = await gameService.playTownCard('game-executor', 'executor-1', {}, 1);
    expect(pendingResult.dtoPeasant.turn).toBe('peasant');
    expect(pendingResult.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'EXECUTOR',
    });

    const result = await gameService.resolvePendingAction('game-executor', 2, {
      targetUid: 'executor-target',
    });

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.players.peasant.town).toEqual([]);
    expect(result.dtoPeasant.discardPile).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'executor-1', isRevealed: true }),
      expect.objectContaining({ uid: 'executor-target', isRevealed: true }),
    ]));
  });

  test('Sabotage descarta aleatoriamente una carta de la mano del campesino', async () => {
    const sabotage = makeCard({
      uid: 'sabotage-1',
      templateId: 12,
      typeKing: 'Action',
    });
    const peasantCard1 = makeCard({
      uid: 'sabotage-hand-1',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const peasantCard2 = makeCard({
      uid: 'sabotage-hand-2',
      templateId: 11,
      typePeasant: 'Action',
      isRevealed: false,
    });
    const originalRandom = Math.random;
    Math.random = () => 0.999999;

    try {
      await saveState('game-sabotage', createState({
        turn: 'king',
        players: {
          king: {
            hand: [sabotage],
          },
          peasant: {
            hand: [peasantCard1, peasantCard2],
          },
        },
      }));

      const result = await gameService.playHandCard('game-sabotage', 'sabotage-1', {}, 1);

      expect(result.dtoKing.turn).toBe('peasant');
      expect(result.dtoKing.players.peasant.hand).toEqual([{ uid: 'sabotage-hand-1' }]);
      expect(result.dtoKing.discardPile).toEqual(expect.arrayContaining([
        expect.objectContaining({ uid: 'sabotage-1', isRevealed: true }),
        expect.objectContaining({ uid: 'sabotage-hand-2', isRevealed: true }),
      ]));
    } finally {
      Math.random = originalRandom;
    }
  });

  test('Mill descarta dos cartas del mazo', async () => {
    const mill = makeCard({
      uid: 'mill-1',
      templateId: 2,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const deck1 = makeCard({ uid: 'mill-a', templateId: 1 });
    const deck2 = makeCard({ uid: 'mill-b', templateId: 2 });
    const deck3 = makeCard({ uid: 'mill-c', templateId: 3 });

    await saveState('game-mill', createState({
      turn: 'king',
      deck: [deck1, deck2, deck3],
      players: {
        king: {
          town: [mill],
        },
      },
    }));

    const result = await gameService.playTownCard('game-mill', 'mill-1', {}, 1);

    expect(result.dtoKing.turn).toBe('peasant');
    expect(result.dtoKing.players.king.hand).toEqual([]);
    expect(result.dtoKing.discardPile).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'mill-1', isRevealed: true }),
      expect.objectContaining({ uid: 'mill-c', isRevealed: true }),
      expect.objectContaining({ uid: 'mill-b', isRevealed: true }),
    ]));
  });

  test('Mass reveal muestra todos los rebeldes sin robar carta extra', async () => {
    const massReveal = makeCard({
      uid: 'reveal-1',
      templateId: 6,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const rebel1 = makeCard({
      uid: 'reveal-r1',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const rebel2 = makeCard({
      uid: 'reveal-r2',
      templateId: 5,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const drawCard = makeCard({
      uid: 'reveal-draw',
      templateId: 99,
      typeKing: 'Action',
    });

    await saveState('game-mass-reveal', createState({
      turn: 'king',
      deck: [drawCard],
      players: {
        king: {
          town: [massReveal],
        },
        peasant: {
          town: [rebel1, rebel2],
        },
      },
    }));

    const result = await gameService.playTownCard('game-mass-reveal', 'reveal-1', {}, 1);

    expect(result.dtoKing.turn).toBe('peasant');
    expect(result.dtoKing.players.king.hand).toEqual([]);
    expect(result.dtoKing.players.peasant.town).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'reveal-r1', isRevealed: true }),
      expect.objectContaining({ uid: 'reveal-r2', isRevealed: true }),
    ]));
  });

  test('Infiltrate mete un Decoy oculto en el mazo en la posicion indicada', async () => {
    const decoy = makeCard({
      uid: 'infiltrate-decoy',
      templateId: 13,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const guard = makeCard({
      uid: 'infiltrate-guard',
      templateId: 1,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const deckA = makeCard({ uid: 'infiltrate-a', templateId: 1 });
    const deckB = makeCard({ uid: 'infiltrate-b', templateId: 2 });

    await saveState('game-infiltrate', createState({
      turn: 'peasant',
      deck: [deckA, deckB],
      players: {
        king: {
          town: [guard],
        },
        peasant: {
          town: [decoy],
        },
      },
    }));

    const pendingResult = await gameService.playTownCard('game-infiltrate', 'infiltrate-decoy', {}, 2);
    expect(pendingResult.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'INFILTRATE',
    });

    const result = await gameService.resolvePendingAction('game-infiltrate', 2, {
      targetUid: 'infiltrate-decoy',
      deckPositions: [1],
    });

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.players.peasant.town).toEqual([]);
    expect(result.dtoPeasant.deck).toEqual([
      { uid: 'infiltrate-a' },
      { uid: 'infiltrate-decoy' },
      { uid: 'infiltrate-b' },
    ]);
  });

  test('Thief obliga al rey a descartar dos cartas y permite al campesino quedarse con una', async () => {
    const thief = makeCard({
      uid: 'thief-1',
      templateId: 10,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const kingCard1 = makeCard({
      uid: 'thief-king-1',
      templateId: 11,
      typeKing: 'Action',
    });
    const kingCard2 = makeCard({
      uid: 'thief-king-2',
      templateId: 14,
      typeKing: 'Action',
    });
    const fillerDeckCard = makeCard({
      uid: 'thief-deck',
      templateId: 99,
    });

    await saveState('game-thief', createState({
      turn: 'peasant',
      deck: [fillerDeckCard],
      players: {
        king: {
          hand: [kingCard1, kingCard2],
        },
        peasant: {
          town: [thief],
        },
      },
    }));

    const pendingResult = await gameService.playTownCard('game-thief', 'thief-1', {}, 2);
    expect(pendingResult.dtoKing.turn).toBe('king');
    expect(pendingResult.dtoKing.pendingAction).toEqual({
      player: 'king',
      type: 'THIEF',
    });

    const step1 = await gameService.resolvePendingAction('game-thief', 1, {
      discardUids: ['thief-king-1', 'thief-king-2'],
    });
    expect(step1.dtoPeasant.turn).toBe('peasant');
    expect(step1.dtoPeasant.pendingAction).toEqual({
      player: 'peasant',
      type: 'THIEF2',
      amount: ['thief-king-1', 'thief-king-2'],
    });

    const result = await gameService.resolvePendingAction('game-thief', 2, {
      targetUid: 'thief-king-1',
    });

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.players.peasant.hand).toEqual([
      expect.objectContaining({ uid: 'thief-king-1', isRevealed: false }),
    ]);
    expect(result.dtoPeasant.discardPile).toEqual([
      expect.objectContaining({ uid: 'thief-king-2', isRevealed: true }),
    ]);
  });

  test('Thief falla si el rey no tiene cartas en la mano', async () => {
    const thief = makeCard({
      uid: 'thief-empty',
      templateId: 10,
      typePeasant: 'Rebel',
      isRevealed: false,
    });

    await saveState('game-thief-empty', createState({
      turn: 'peasant',
      players: {
        peasant: {
          town: [thief],
        },
      },
    }));

    await expectActionError(
      () => gameService.playTownCard('game-thief-empty', 'thief-empty', {}, 2),
      'El rey no tiene cartas en la mano'
    );
  });

  test('Recuperar rebeldes saca rebeldes del descarte y los pone ocultos en el pueblo', async () => {
    const recover = makeCard({
      uid: 'recover-1',
      templateId: 1,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const discardRebel1 = makeCard({
      uid: 'recover-discard-1',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: true,
    });
    const discardRebel2 = makeCard({
      uid: 'recover-discard-2',
      templateId: 5,
      typePeasant: 'Rebel',
      isRevealed: true,
    });
    const fillerDeckCard = makeCard({
      uid: 'recover-deck',
      templateId: 99,
    });

    await saveState('game-recover-rebels', createState({
      turn: 'peasant',
      deck: [fillerDeckCard],
      discardPile: [discardRebel1, discardRebel2],
      players: {
        peasant: {
          town: [recover],
        },
      },
    }));

    const result = await gameService.playTownCard('game-recover-rebels', 'recover-1', {}, 2);

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.players.peasant.town).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'recover-1', isRevealed: true }),
      expect.objectContaining({ uid: 'recover-discard-1', isRevealed: false }),
      expect.objectContaining({ uid: 'recover-discard-2', isRevealed: false }),
    ]));
    expect(result.dtoPeasant.discardPile).toEqual([]);
  });

  test('Shuffle and Draw 3 devuelve otras cartas al mazo y deja al campesino con tres cartas', async () => {
    const shuffleRebel = makeCard({
      uid: 'shuffle-1',
      templateId: 2,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const otherTownRebel = makeCard({
      uid: 'shuffle-town',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const handCard1 = makeCard({
      uid: 'shuffle-hand-1',
      templateId: 11,
      typePeasant: 'Action',
    });
    const handCard2 = makeCard({
      uid: 'shuffle-hand-2',
      templateId: 15,
      typePeasant: 'Action',
    });
    const deck1 = makeCard({ uid: 'shuffle-deck-1', templateId: 6 });
    const deck2 = makeCard({ uid: 'shuffle-deck-2', templateId: 7 });
    const deck3 = makeCard({ uid: 'shuffle-deck-3', templateId: 8 });
    const originalRandom = Math.random;
    Math.random = () => 0.999999;

    try {
      await saveState('game-shuffle-draw', createState({
        turn: 'peasant',
        deck: [deck1, deck2, deck3],
        players: {
          peasant: {
            town: [shuffleRebel, otherTownRebel],
            hand: [handCard1, handCard2],
          },
        },
      }));

      const result = await gameService.playTownCard('game-shuffle-draw', 'shuffle-1', {}, 2);

      expect(result.dtoPeasant.turn).toBe('king');
      expect(result.dtoPeasant.players.peasant.town).toEqual([
        expect.objectContaining({ uid: 'shuffle-1', isRevealed: true }),
      ]);
      expect(result.dtoPeasant.players.peasant.hand).toHaveLength(3);
    } finally {
      Math.random = originalRandom;
    }
  });

  test('Cleanup elimina todos los guardias y rebeldes del pueblo', async () => {
    const cleanup = makeCard({
      uid: 'cleanup-1',
      templateId: 6,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const peasantRebel = makeCard({
      uid: 'cleanup-rebel',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const kingGuard = makeCard({
      uid: 'cleanup-guard',
      templateId: 1,
      typeKing: 'Guard',
      isRevealed: true,
    });
    const fillerDeckCard = makeCard({
      uid: 'cleanup-deck',
      templateId: 99,
    });

    await saveState('game-cleanup', createState({
      turn: 'peasant',
      deck: [fillerDeckCard],
      players: {
        king: {
          town: [kingGuard],
        },
        peasant: {
          town: [cleanup, peasantRebel],
        },
      },
    }));

    const result = await gameService.playTownCard('game-cleanup', 'cleanup-1', {}, 2);

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.players.king.town).toEqual([]);
    expect(result.dtoPeasant.players.peasant.town).toEqual([]);
    expect(result.dtoPeasant.discardPile).toEqual(expect.arrayContaining([
      expect.objectContaining({ uid: 'cleanup-guard', isRevealed: true }),
      expect.objectContaining({ uid: 'cleanup-1', isRevealed: true }),
      expect.objectContaining({ uid: 'cleanup-rebel', isRevealed: true }),
    ]));
  });

  test('Reorganizacion total devuelve el pueblo a la mano y mezcla el descarte en el mazo', async () => {
    const regroup = makeCard({
      uid: 'regroup-1',
      templateId: 12,
      typePeasant: 'Action',
    });
    const townRebel = makeCard({
      uid: 'regroup-town',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: true,
    });
    const discardCard = makeCard({
      uid: 'regroup-discard',
      templateId: 11,
      typePeasant: 'Action',
      isRevealed: true,
    });
    const deckCard = makeCard({
      uid: 'regroup-deck',
      templateId: 99,
    });
    const originalRandom = Math.random;
    Math.random = () => 0.999999;

    try {
      await saveState('game-regroup', createState({
        turn: 'peasant',
        deck: [deckCard],
        discardPile: [discardCard],
        players: {
          peasant: {
            hand: [regroup],
            town: [townRebel],
          },
        },
      }));

      const result = await gameService.playHandCard('game-regroup', 'regroup-1', {}, 2);

      expect(result.dtoPeasant.turn).toBe('king');
      expect(result.dtoPeasant.players.peasant.town).toEqual([]);
      expect(result.dtoPeasant.players.peasant.hand).toEqual([
        expect.objectContaining({ uid: 'regroup-town', isRevealed: false }),
      ]);
      expect(result.dtoPeasant.discardPile).toEqual([
        expect.objectContaining({ uid: 'regroup-1', isRevealed: true }),
      ]);
      expect(result.dtoPeasant.deck).toEqual(expect.arrayContaining([
        { uid: 'regroup-deck' },
        { uid: 'regroup-discard' },
      ]));
    } finally {
      Math.random = originalRandom;
    }
  });

  test('playTownCard con el Assassin revelado sin guardias devuelve victoria definitiva del campesino', async () => {
    prismaMock.game.create.mockResolvedValue({ idGame: 1 });
    prismaMock.user.update.mockResolvedValue({});

    const assassin = makeCard({
      uid: 'assassin-1',
      templateId: 16,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const fillerDeckCard = makeCard({
      uid: 'deck-safe-4',
      templateId: 99,
    });

    await saveState('game-assassin', createState({
      turn: 'peasant',
      scores: { 1: 0, 2: 1 },
      deck: [fillerDeckCard],
      players: {
        peasant: {
          town: [assassin],
        },
      },
    }));

    const result = await gameService.playTownCard('game-assassin', 'assassin-1', {}, 2);

    expect(result).toEqual({
      isGameOver: true,
      winnerId: 2,
      reason: 'ASSASSIN_STRIKE',
    });
    expect(prismaMock.game.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.update).toHaveBeenCalledTimes(2);
    expect(redisMock.del).toHaveBeenCalledWith('game:game-assassin');
  });

  test('peasantDrawACard roba del mazo y entrega el turno al rey', async () => {
    const drawnCard = makeCard({
      uid: 'draw-peasant',
      templateId: 1,
      typePeasant: 'Rebel',
    });
    const fillerDeckCard = makeCard({
      uid: 'draw-peasant-2',
      templateId: 99,
      typePeasant: 'Rebel',
    });

    await saveState('game-draw', createState({
      turn: 'peasant',
      deck: [fillerDeckCard, drawnCard],
    }));

    const result = await gameService.peasantDrawACard('game-draw', 2);

    expect(result.dtoPeasant.turn).toBe('king');
    expect(result.dtoPeasant.players.peasant.hand).toEqual([
      expect.objectContaining({
        uid: 'draw-peasant',
        templateId: 1,
      }),
    ]);
    expect(result.dtoPeasant.deck).toEqual([{ uid: 'draw-peasant-2' }]);
  });

  test('playHandCard falla si intenta jugar una carta fuera de turno', async () => {
    const rebel = makeCard({
      uid: 'turn-rebel',
      templateId: 4,
      typePeasant: 'Rebel',
    });

    await saveState('game-wrong-turn', createState({
      turn: 'king',
      players: {
        peasant: {
          hand: [rebel],
        },
      },
    }));

    await expectActionError(
      () => gameService.playHandCard('game-wrong-turn', 'turn-rebel', {}, 2),
      'No es el turno del jugador'
    );
  });

  test('playHandCard con Strike falla si el rey no tiene suficientes guardias en el pueblo', async () => {
    const strike = makeCard({ uid: 'bad-strike', templateId: 10, typeKing: 'Action' });
    const guard = makeCard({
      uid: 'only-guard',
      templateId: 1,
      typeKing: 'Guard',
      isRevealed: true,
    });

    await saveState('game-bad-strike', createState({
      turn: 'king',
      players: {
        king: {
          hand: [strike],
          town: [guard],
        },
      },
    }));

    await expectActionError(
      () => gameService.playHandCard('game-bad-strike', 'bad-strike', {}, 1),
      'No hay guardias suficientes en el pueblo'
    );
  });

  test('resolvePendingAction falla si el jugador no tiene una accion pendiente asignada', async () => {
    await saveState('game-no-pending', createState({
      turn: 'king',
      pendingAction: {
        player: 'king',
        type: 'ARREST',
      },
    }));

    await expectActionError(
      () => gameService.resolvePendingAction('game-no-pending', 2, { option: 'DECK' }),
      'No hay acciones pendientes para este jugador'
    );
  });

  test('condemnARebel falla si el rey intenta condenar un rebelde ya revelado', async () => {
    const revealedRebel = makeCard({
      uid: 'revealed-rebel',
      templateId: 4,
      typePeasant: 'Rebel',
      isRevealed: true,
    });

    await saveState('game-condemn-error', createState({
      turn: 'king',
      players: {
        peasant: {
          town: [revealedRebel],
        },
      },
    }));

    await expectActionError(
      () => gameService.condemnARebel('game-condemn-error', false, 'revealed-rebel', 1),
      'No se puede condenar a un rebelde revelado'
    );
  });

  test('si el rey intenta robar con el mazo vacio gana el campesino', async () => {
    prismaMock.game.create.mockResolvedValue({ idGame: 3 });
    prismaMock.user.update.mockResolvedValue({});

    await saveState('game-empty-deck', createState({
      turn: 'king',
      scores: { 1: 0, 2: 1 },
    }));

    const result = await gameService.passTurn('game-empty-deck', 1);

    expect(result).toEqual({
      isGameOver: true,
      winnerId: 2,
      reason: 'KING_DECK_EMPTY',
    });
    expect(prismaMock.game.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.update).toHaveBeenCalledTimes(2);
  });

  test('resolvePendingAction de Charlatan falla si no se devuelven tantas cartas como se robaron', async () => {
    const handCard1 = makeCard({ uid: 'char-error-1', templateId: 1 });
    const handCard2 = makeCard({ uid: 'char-error-2', templateId: 2 });

    await saveState('game-charlatan-error', createState({
      turn: 'peasant',
      pendingAction: {
        player: 'peasant',
        type: 'CHARLATAN2',
        amount: 2,
      },
      players: {
        peasant: {
          hand: [handCard1, handCard2],
        },
      },
    }));

    await expectActionError(
      () => gameService.resolvePendingAction('game-charlatan-error', 2, { handUids: ['char-error-1'] }),
      'Debes devolver exactamente 2 carta(s).'
    );
  });

  test('resolvePendingAction de Revolt falla si no coincide el numero de cartas y posiciones', async () => {
    await saveState('game-revolt-error', createState({
      turn: 'peasant',
      pendingAction: {
        player: 'peasant',
        type: 'REVOLT',
      },
      players: {
        peasant: {
          town: [makeCard({ uid: 'rev-err', templateId: 4, typePeasant: 'Rebel' })],
        },
      },
    }));

    await expectActionError(
      () => gameService.resolvePendingAction('game-revolt-error', 2, { rebelUids: ['rev-err'], deckPositions: [] }),
      'La cantidad de cartas rebeldes y posiciones en el mazo debe ser la misma'
    );
  });

  test('resolvePendingAction de INFILTRATE falla si no se pasa exactamente una posicion', async () => {
    await saveState('game-infiltrate-error', createState({
      turn: 'peasant',
      pendingAction: {
        player: 'peasant',
        type: 'INFILTRATE',
      },
      players: {
        peasant: {
          town: [makeCard({ uid: 'inf-err', templateId: 13, typePeasant: 'Rebel' })],
        },
      },
    }));

    await expectActionError(
      () => gameService.resolvePendingAction('game-infiltrate-error', 2, { targetUid: 'inf-err', deckPositions: [] }),
      'Debes seleccionar exactamente una posición en el mazo para infiltrar la carta'
    );
  });

  test('condemnARebel desde mazo gana la partida si revela al Assassin', async () => {
    prismaMock.game.create.mockResolvedValue({ idGame: 4 });
    prismaMock.user.update.mockResolvedValue({});

    const deckCard = makeCard({
      uid: 'condemn-deck-card',
      templateId: 16,
      typePeasant: 'Rebel',
      isRevealed: false,
    });
    const fillerDeckCard = makeCard({
      uid: 'condemn-deck-filler',
      templateId: 99,
      isRevealed: false,
    });

    await saveState('game-condemn-deck', createState({
      turn: 'king',
      scores: { 1: 1, 2: 0 },
      deck: [fillerDeckCard, deckCard],
    }));

    const result = await gameService.condemnARebel('game-condemn-deck', true, null, 1);

    expect(result).toEqual({
      isGameOver: true,
      winnerId: 1,
      reason: 'ASSASSIN_EXPOSED',
    });
  });
});
