import type { CardState } from "./GameService";

export const CARDS_THAT_CAN_INFILTRATE = [13,16];

export interface SelectedCard extends CardState{
    position: 'hand' | 'myTown' | 'rivalTown' | 'deck' | 'discard';
    chosenPosition?: number;
}

export interface PendingActionUIConfig {
    instructionText : string;
    allowedZones: ('hand' | 'myTown' | 'rivalTown' | 'discard')[];
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
            return { rebelUid: rebel?.uid, guardUid: guard?.uid};
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
            const isInDiscard = selectedCards.some(c => c.position === 'discard');
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

}