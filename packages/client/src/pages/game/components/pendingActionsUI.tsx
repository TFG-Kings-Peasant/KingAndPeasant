import type { CardState } from "./GameService";

export const CARDS_THAT_CAN_INFILTRATE = [13,16];

export interface SelectedCard extends CardState{
    position: 'hand' | 'myTown' | 'rivalTown' | 'deck' | 'discard';
    chosenPosition?: number;
}

export interface PendingActionUIConfig {
    instructionText : string;
    allowedZones: ('hand' | 'myTown' | 'rivalTown' | 'discard' | 'deck')[];
    canConfirm: (selectedCards: SelectedCard[]) => boolean;
    formatPayload: (selectedCards: SelectedCard[]) => Record<string, unknown>;
}

export const peasantPendingUI : Record<string, PendingActionUIConfig> = {
    'BRAWL': {
        instructionText: "Selecciona 1 Rebelde de tu pueblo y 1 Guardia del pueblo rival",
        allowedZones: ['myTown', 'rivalTown'],
        canConfirm: (selectedCards) => {
            const hasRebel = selectedCards.some(c => c.typePeasant === 'Rebel' && c.position === 'myTown');
            const hasGuard = selectedCards.some(c => c.typeKing === 'Guard' && c.position === 'rivalTown');
            return selectedCards.length === 2 && hasGuard && hasRebel;
        },
        formatPayload: (selectedCards) => {
            const rebel = selectedCards.find(c => c.position === 'myTown');
            const guard = selectedCards.find(c => c.position === 'rivalTown');
            return {
                rebelUid: rebel?.uid ?? "", 
                guardUid: guard?.uid ?? ""
            };
        }
    },
    'RALLY': {
        instructionText: "Selecciona hasta 2 rebeldes para posicionar en el pueblo boca abajo",
        allowedZones: ['hand'],
        canConfirm: (selectedCards) => {
            const hasRebel = selectedCards.every(c => c.position === 'hand' && c.typePeasant === 'Rebel');
            return selectedCards.length >= 0 && selectedCards.length < 3 && hasRebel;
        },
        formatPayload: (selectedCards) => {
            const selectedCardsUid = selectedCards.map(c => c.uid);
            return { selectedCardsUid: selectedCardsUid};
        }
    },
    'REASSEMBLE1': {
        instructionText: "Selecciona hasta 2 cartas del mazo de descartes",
        allowedZones: ['discard'],
        canConfirm: (selectedCards) => {
            const isInDiscard = selectedCards.every(c => c.position === 'discard');
            return selectedCards.length >= 0 && selectedCards.length < 3 && isInDiscard;
        },
        formatPayload: (selectedCards) => {
            const selectedCardsUid = selectedCards.map(c => c.uid);
            return { discardUids: selectedCardsUid};
        }
    },
    'REASSEMBLE2': {
        instructionText: "Selecciona hasta 1 rebelde para posicionar en el pueblo boca abajo",
        allowedZones: ['hand'],
        canConfirm: (selectedCards) => {
            const hasRebel = selectedCards.every(c => c.position === 'hand' && c.typePeasant === 'Rebel');
            return selectedCards.length >= 0 && selectedCards.length < 2 && hasRebel;
        },
        formatPayload: (selectedCards) => {
            return { rebelUid: selectedCards[0]?.uid || ""}
        }
    },
    'REVOLT': {
        instructionText: "Selecciona las posiciones en el mazo para tus infiltrados",
        allowedZones: ['myTown'],
        canConfirm: (selectedCards) => {
            const canInfiltrate = selectedCards.some(c => CARDS_THAT_CAN_INFILTRATE.includes(c.templateId as number))
            return selectedCards.length > 0 && canInfiltrate;
        }, 
        formatPayload: (selectedCards) => {
            return {
                rebelUids: selectedCards.map(c => c.uid),
                deckPositions: selectedCards.map(c => c.chosenPosition ?? 0)
            }
        },
    },

    "EXECUTOR": {
        instructionText: "Selecciona 1 rebelde escondido en el pueblo para descartarlo",
        allowedZones: ['myTown'],
        canConfirm: (selectedCards) => {
            const isHiden = selectedCards.every(c => c.typePeasant === 'Rebel' && c.position === 'myTown' && !c.isRevealed);
            return selectedCards.length > 0 && isHiden;
        }, 
        formatPayload: (selectedCards) => {
            return {
                targetUid: selectedCards[0]?.uid || "",
            }
        },
    },
    "THUG":  {
        instructionText: "Selecciona 1 guardia en el pueblo rival para descartarlo",
        allowedZones: ['rivalTown'],
        canConfirm: (selectedCards) => {
            const validate = selectedCards.every(c => c.typeKing === 'King' && c.position === 'rivalTown');
            return selectedCards.length > 0 && validate;
        }, 
        formatPayload: (selectedCards) => {
            return {
                targetUid: selectedCards[0]?.uid || "",
            }
        },
    },
    "COURTESAN":  {
        // TODO
        instructionText: "Elige una de las tres cartas para robar",
        allowedZones: ['myTown'],
        canConfirm: (selectedCards) => {
            const canInfiltrate = selectedCards.some(c => CARDS_THAT_CAN_INFILTRATE.includes(c.templateId as number))
            return selectedCards.length > 0 && canInfiltrate;
        }, 
        formatPayload: (selectedCards) => {
            return {
                rebelUids: selectedCards.map(c => c.uid),
                deckPositions: selectedCards.map(c => c.chosenPosition ?? 0)
            }
        },
    },
    "CHARLATAN": {
        //TODO
        instructionText: "Roba hasta 3 cartas",
        allowedZones: ['deck'],
        canConfirm: (selectedCards) => {
            const canInfiltrate = selectedCards.some(c => CARDS_THAT_CAN_INFILTRATE.includes(c.templateId as number))
            return selectedCards.length > 0 && canInfiltrate;
        }, 
        formatPayload: (selectedCards) => {
            return {
                rebelUids: selectedCards.map(c => c.uid),
                deckPositions: selectedCards.map(c => c.chosenPosition ?? 0)
            }
        },
    },
    "CHARLATAN2": {
        instructionText: "Devuelve el mismo numero de cartas que robaste a la parte superior del mazo",
        allowedZones: ['hand'],
        canConfirm: (selectedCards) => {
            const validate = selectedCards.every(c => c.position === 'hand');
            return selectedCards.length > 0 && validate;
        }, 
        formatPayload: (selectedCards) => {
            return {
                handUids: selectedCards.map(c => c.uid),
            }
        },
    },
    "RAT": {
        //TODO: Restricción para que no pueda escoger esta carta
        instructionText: "Selecciona hasta 2 reveldes para devolver a la mano",
        allowedZones: ['myTown'],
        canConfirm: (selectedCards) => {
            const validate = selectedCards.every(c => c.typePeasant === 'Rebel' && c.position === 'myTown');

            return selectedCards.length > 0 && validate && selectedCards.length < 3;
        }, 
        formatPayload: (selectedCards) => {
            return {
                townUids: selectedCards.map(c => c.uid),
            }
        },
    },
    "RAT2": {
        instructionText: "Selecciona hasta 2 reveldes de tu mano para esconder en el pueblo",
        allowedZones: ['hand'],
        canConfirm: (selectedCards) => {
            const validate = selectedCards.every(c => c.typePeasant === 'Rebel' && c.position === 'hand');
            return selectedCards.length > 0 && validate && selectedCards.length < 3;
        }, 
        formatPayload: (selectedCards) => {
            return {
                handUids: selectedCards.map(c => c.uid),
            }
        },
    },
    "THIEF2":{
        // TODO: Restringir la seleccion solo a las cartas que el rey ha descartado
        instructionText: "Selecciona una de las 2 cartas descartadas por el rey",
        allowedZones: ['discard'],
        canConfirm: (selectedCards) => {
            return selectedCards.length > 0 && selectedCards.length < 2 && selectedCards.every(c => c.position === 'discard');
        }, 
        formatPayload: (selectedCards) => {
            return {
                targetUid: selectedCards[0]?.uid || ""
            }
        },
    },
    "DECOY": {
        instructionText: "Selecciona 1 guardia del pueblo del rival para descartarlo",
        allowedZones: ['rivalTown'],
        canConfirm: (selectedCards) => {
            return selectedCards.length > 0 && selectedCards.length < 2 && selectedCards.every(c => c.position === 'rivalTown');
        }, 
        formatPayload: (selectedCards) => {
            return {
                targetUid: selectedCards[0]?.uid || "",
            }
        },
    }
}

export const kingPendingUI : Record<string, PendingActionUIConfig> = {
    'STRIKE': {
        instructionText: "Selecciona 2 guardias para mobilizar",
        allowedZones: ['myTown'],
        canConfirm: (selectedCards) => {
            const canMobiliza = selectedCards.every(c => c.typeKing === 'Guard' && c.position === 'myTown');
            return selectedCards.length === 2 && canMobiliza;
        },
        formatPayload: (selectedCards) => {
            return {
                guardUid1: selectedCards[0].uid,
                guardUid2: selectedCards[1].uid
            }
        }
    },
    'ARREST': {
        instructionText: "Descarta la carta superior del mazo o un rebelde seleccionado",
        allowedZones: ['rivalTown', 'deck'],
        canConfirm: (selectedCards) => {
            if (selectedCards.length === 1) {
                const isRebel = selectedCards.some(c => c.typePeasant === 'Rebel' && c.position === 'rivalTown');
                return isRebel;
            }
            return selectedCards.length === 0;
        },
        formatPayload: (selectedCards) => {
            if (selectedCards.length === 0) {
                return { option: 'DECK' }; 
            }
            return { 
                option: 'TOWN', 
                targetUid: selectedCards[0].uid 
            };
        }
    },
    'REASSEMBLE1': {
        instructionText: "Selecciona hasta 2 cartas del mazo de descartes",
        allowedZones: ['discard'],
        canConfirm: (selectedCards) => {
            const isInDiscard = selectedCards.every(c => c.position === 'discard');
            return selectedCards.length >= 0 && selectedCards.length < 3 && isInDiscard;
        },
        formatPayload: (selectedCards) => {
            const selectedCardsUid = selectedCards.map(c => c.uid);
            return { discardUids: selectedCardsUid};
        }
    },
    'REASSEMBLE2': {
        instructionText: "Selecciona hasta 1 guardia para posicionar en el pueblo boca arriba",
        allowedZones: ['hand'],
        canConfirm: (selectedCards) => {
            const hasGuard = selectedCards.every(c => c.position === 'hand' && c.typeKing === 'Guard');
            return selectedCards.length >= 0 && selectedCards.length < 2 && hasGuard;
        },
        formatPayload: (selectedCards) => {
            return { guardUid: selectedCards[0]?.uid || ""}
        }
    },

    'THIEF':  {
        instructionText: "Selecciona 2 cartas de tu mano para descartar",
        allowedZones: ['hand'],
        canConfirm: (selectedCards) => {
            const validate = selectedCards.every(c => c.position === 'hand' && c.typeKing === 'Guard' && c.position === 'hand');
            return selectedCards.length >= 0 && selectedCards.length < 2 && validate;
        },
        formatPayload: (selectedCards) => {
            return { 
                discardUids: selectedCards.map(c => c.uid) 
            }
        }
    },
    "CRIER": {
        instructionText: "Selecciona hasta 1 guardia para posicionar en el pueblo boca arriba",
        allowedZones: ['hand'],
        canConfirm: (selectedCards) => {
            const hasGuard = selectedCards.every(c => c.position === 'hand' && c.typeKing === 'Guard');
            return selectedCards.length >= 0 && selectedCards.length < 2 && hasGuard;
        },
        formatPayload: (selectedCards) => {
            return { targetUid: selectedCards[0]?.uid || ""}
        }
    },
    "INQUISITOR": {
        instructionText: "Selecciona 1 guardia de tu mano para mobilizar",
        allowedZones: ['hand'],
        canConfirm: (selectedCards) => {
            const hasGuard = selectedCards.every(c => c.position === 'hand' && c.typeKing === 'Guard');
            return selectedCards.length >= 0 && selectedCards.length < 2 && hasGuard;
        },
        formatPayload: (selectedCards) => {
            return { targetUid: selectedCards[0]?.uid || ""}
        }
    },
    "SPY": {
        instructionText: "Selecciona 1 rebelde escondido en el pueblo rival para revelar su identidad",
        allowedZones: ['rivalTown'],
        canConfirm: (selectedCards) => {
            const isHiden = selectedCards.every(c => c.typePeasant === 'Rebel' && c.position === 'rivalTown' && !c.isRevealed);

            return selectedCards.length >= 0 && selectedCards.length < 2 && isHiden;
        },
        formatPayload: (selectedCards) => {
            return { targetUid: selectedCards[0]?.uid || ""}
        }
    },
    "ADVISOR":  {
        //TODO: MOSTRAR Carta: Elegir si se coloca al final de la deck o al principio
        instructionText: "Elige si colocar la carta al final o al principio del mazo",
        allowedZones: ['hand'],
        canConfirm: (selectedCards) => {
            const hasGuard = selectedCards.every(c => c.position === 'hand' && c.typeKing === 'Guard');
            return selectedCards.length >= 0 && selectedCards.length < 2 && hasGuard;
        },
        formatPayload: (selectedCards) => {
            return { guardUid: selectedCards[0]?.uid || ""}
        }
    },
    "GUARDIAN":{
        //TODO: Seleccionar una carta de la deck para revelar
        instructionText: "Selecciona 1 carta de la deck para revelarla ",
        allowedZones: ['hand'],
        canConfirm: (selectedCards) => {
            const hasGuard = selectedCards.every(c => c.position === 'hand' && c.typeKing === 'Guard');
            return selectedCards.length >= 0 && selectedCards.length < 2 && hasGuard;
        },
        formatPayload: (selectedCards) => {
            return { guardUid: selectedCards[0]?.uid || ""}
        }

    },
    "SENTINEL": {
        //TODO: MOSTRAR 3 primeras cartas de la deck y esperara confirmacion para devolverlas a la deck
        instructionText: "Selecciona hasta 1 guardia para posicionar en el pueblo boca arriba",
        allowedZones: ['hand'],
        canConfirm: (selectedCards) => {
            const hasGuard = selectedCards.every(c => c.position === 'hand' && c.typeKing === 'Guard');
            return selectedCards.length >= 0 && selectedCards.length < 2 && hasGuard;
        },
        formatPayload: (selectedCards) => {
            return { guardUid: selectedCards[0]?.uid || ""}
        }
    },
    "WATCHMAN": {
        //TODO: Eperara confirmacion para volver a girar las cartas del rebel

        instructionText: "Selecciona hasta 1 guardia para posicionar en el pueblo boca arriba",
        allowedZones: ['hand'],
        canConfirm: (selectedCards) => {
            const hasGuard = selectedCards.every(c => c.position === 'hand' && c.typeKing === 'Guard');
            return selectedCards.length >= 0 && selectedCards.length < 2 && hasGuard;
        },
        formatPayload: (selectedCards) => {
            return { guardUid: selectedCards[0]?.uid || ""}
        }
        
    }
}