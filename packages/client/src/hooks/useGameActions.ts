import { passTurn, drawACard, playCard, condemnRebel, resolvePendingAction, type CardState } from "../pages/game/components/GameService";

export const useGameActions = (
  id: string | undefined, 
  user: any, 
  myRoleName: string, 
  gameState: any, 
  setError: (msg: string) => void,
  setSelectedCard: (card: CardState | null) => void
) => {
  
  const checkTurn = () => {
    if (gameState?.turn !== myRoleName) {
      alert("No es tu turno");
      return false;
    }
    return true;
  };

  const handlePassTurn = async () => {
    if (!id || !user?.authToken || !checkTurn()) return;
    try {
      await passTurn(Number(id), user.authToken);
    } catch (err: any) {
      alert(err.message || "Ocurrió un error");
      setError(err.message);
    }
  };

  const handleDrawCard = async () => {
    if (!id || !user?.authToken || !checkTurn()) return;
    try {
      await drawACard(Number(id), user.authToken);
    } catch (err: any) {
      alert(err.message || "Ocurrió un error");
      setError(err.message);
    }
  };

  const handlePlayCard = async (selectedCard: CardState, isKing: boolean) => {
    if (!id || !user?.authToken || !checkTurn() || !selectedCard) return;
    const cardToPlayUid = selectedCard.uid;
    try {
      if (selectedCard.position === "rivalTown" && isKing) {
        await condemnRebel(Number(id), false, cardToPlayUid, user.authToken);
      } else if (selectedCard.position === "hand") {
        await playCard(Number(id), cardToPlayUid, {}, true, user.authToken);
      } else if (selectedCard.position === "myTown") {
        await playCard(Number(id), cardToPlayUid, {}, false, user.authToken);
      }
      setSelectedCard(null);
    } catch (err: any) {
      alert(err.message || "Ocurrió un error");
      setError("Error jugando una carta");
    }
  };

  const handleCondemnDeckCard = async () => {
    if (!id || !user?.authToken || !checkTurn()) return;
    try {
      await condemnRebel(Number(id), true, "", user.authToken);
      setSelectedCard(null);
    } catch (err: any) {
      alert(err.message || "Ocurrió un error");
      setError("Error al condenar carta del mazo");
    }
  };

  const handleResolvePending = async (targetData: Record<string, unknown>) => {
    if (!id || !user?.authToken || !checkTurn()) return;
    try {
      await resolvePendingAction(Number(id), targetData, user.authToken);
    } catch (err: any) {
      alert(err.message || "Ocurrió un error");
      setError("Error jugando una carta");
    }
  };

  return {
    handlePassTurn,
    handleDrawCard,
    handlePlayCard,
    handleCondemnDeckCard,
    handleResolvePending,
  };
};