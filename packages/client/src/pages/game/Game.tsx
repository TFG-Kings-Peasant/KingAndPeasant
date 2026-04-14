import { useEffect, useState } from "react";
import { getPosibleActions, type CardPosition, type CardState } from "./components/GameService";
import "./GameChat.css";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./Game.css";
import { CARDS_THAT_CAN_INFILTRATE, peasantPendingUI, kingPendingUI } from "./components/pendingActionsUI";
import type { SelectedCard } from "./components/pendingActionsUI";
import { InfiltrateModal } from "./components/InfiltrateModal";
import { CardDetailModal } from "./components/CardDetailModal";
import { DiscardModal } from "./components/DiscardModal";
import { DeckModal } from "./components/DeckModal";
import { PendingActionModal } from "./components/PendingActionModal";
import { useGameData } from "../../hooks/useGameData";
import { useGameActions } from "../../hooks/useGameActions";
import { RivalArea } from "./components/RivalArea";
import { PlayerArea } from "./components/PlayerArea";
import { GameSidebar } from "./components/GameSidebar";
import { ErrorToast } from "./components/ErrorToast";
import { AnnouncementModal } from "./components/AnnouncementModal";

function Game() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const {socket, user} = useAuth()
  const { gameState, loading, error, setError, gameOverData, announcement, setAnnouncement } = useGameData(id, user, socket);
  
  const [selectedCard, setSelectedCard] = useState<CardState | null>(null);
  const [actionTargets, setActionTargets] = useState<SelectedCard[]>([]);
  const [numberInput, setNumberInput] = useState<number | null>(null);
  const activeConfig = gameState?.pendingAction
    ? (gameState.pendingAction.player === "king" 
        ? kingPendingUI[gameState.pendingAction.type] 
        : peasantPendingUI[gameState.pendingAction.type])
    : null;
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);

  const [infiltrateCard, setInfiltrateCard] = useState<SelectedCard | null>(null);
  useEffect(() => {
    setActionTargets([]);
  }, [gameState?.pendingAction?.type]);

  useEffect(() => {
    if (error) {
      setSelectedCard(null);
    }
  }, [error]);

  if (loading || !gameState || !user || !id) return <div>Cargando el Tablero...</div>;

  const isKing = Number(user.id) === gameState.players.king.id;
  const myPlayer = isKing ? gameState.players.king : gameState.players.peasant;
  const rivalPlayer = isKing ? gameState.players.peasant : gameState.players.king;
  const isWinner = gameOverData ? Number(user?.id) === gameOverData.winnerId : false;
  const myRoleName = isKing ? "king" : "peasant";
  const rivalRoleName = isKing ? "peasant" : "king";
  const pendingAction = gameState.pendingAction && gameState.pendingAction.player == myRoleName? true: false;
  
  const myScore = gameState.scores[String(user.id)] || 0;
  const rivalScore = gameState.scores[String(rivalPlayer.id)] || 0;
  
  const {
    handlePassTurn,
    handleDrawCard,
    handlePlayCard,
    handleCondemnDeckCard,
    handleResolvePending,
  } = useGameActions(id, user, myRoleName, gameState, setError, setSelectedCard);

  const handleSelectCard = (card: CardState, position: CardPosition | null) => {
    if(activeConfig && position && activeConfig.allowedZones.includes(position)){
      const isRevolt = gameState?.pendingAction?.type === 'REVOLT' || gameState?.pendingAction?.type === 'INFILTRATE';
      const isValidTarget = !isRevolt || CARDS_THAT_CAN_INFILTRATE.includes(card.templateId as number);

      if (isValidTarget) {
        const exists = actionTargets.find(t => t.uid === card.uid);
        if (exists) {
          setActionTargets(prev => prev.filter(t => t.uid !== card.uid));
          return;
        }

        if (isRevolt && position === 'myTown' && card.isRevealed === false) {
          setInfiltrateCard({ ...card, position });
          return;
        }

        const targetedCard: SelectedCard = {...card, position: position};
        setActionTargets(prev => [...prev, targetedCard]);
        return;
      }
    }
    if(position) {
      card.position = position;
    }
    setSelectedCard(card);
  }

  return (
  <div className="game-board">
    <div className="game-main-area">
      
      <RivalArea 
        rivalRoleName={rivalRoleName}
        rivalPlayer={rivalPlayer}
        actionTargets={actionTargets}
        gameState={gameState}
        activeConfig={activeConfig}
        onSelectCard={handleSelectCard}
      />

      <PlayerArea 
        myRoleName={myRoleName}
        myPlayer={myPlayer}
        actionTargets={actionTargets}
        gameState={gameState}
        activeConfig={activeConfig}
        onSelectCard={handleSelectCard}
      />

    </div>

    <GameSidebar
        gameState={gameState}
        myScore={myScore}
        rivalScore={rivalScore}
        myRoleName={myRoleName}
        socket={socket}
        gameId={id}
        userName={user.name}
        setShowDeckModal={setShowDeckModal}
        setShowDiscardModal={setShowDiscardModal}
        onPassTurn={handlePassTurn}
        onDrawCard={handleDrawCard}
        onCondemnDeckCard={handleCondemnDeckCard}
      />
    
    {pendingAction && activeConfig && (
      <PendingActionModal 
        gameState={gameState}
        activeConfig={activeConfig}
        actionTargets={actionTargets}
        numberInput={numberInput}
        setNumberInput={setNumberInput}
        onConfirm={(payload) => {
          handleResolvePending(payload);
          setActionTargets([]); 
          setSelectedCard(null);
          setNumberInput(null);
        }}
      />
    )}

    {selectedCard && (
      <CardDetailModal 
        selectedCard={selectedCard}
        gameState={gameState}
        myRoleName={myRoleName}
        isKing={isKing}
        onClose={() => setSelectedCard(null)}
        onPlayCard={() => handlePlayCard(selectedCard, isKing)}
        getPosibleActions={getPosibleActions}
      />
    )}

    {showDiscardModal && (
      <DiscardModal 
        gameState={gameState}
        actionTargets={actionTargets}
        activeConfig={activeConfig}
        onClose={() => setShowDiscardModal(false)}
        onSelectCard={handleSelectCard}
        onSetSelectedCard={setSelectedCard}
      />
    )}

    {showDeckModal && (
      <DeckModal 
        gameState={gameState}
        actionTargets={actionTargets}
        activeConfig={activeConfig}
        onClose={() => setShowDeckModal(false)}
        onSelectCard={handleSelectCard}
        onSetSelectedCard={setSelectedCard}
      />
    )}

    {infiltrateCard && (
      <InfiltrateModal
        card={infiltrateCard}
        deckCount={gameState.deck.length}
        onSelectPosition={(pos) => {
          const targetedCard: SelectedCard = { ...infiltrateCard, chosenPosition: pos };
          setActionTargets(prev => [...prev, targetedCard]);
          setInfiltrateCard(null); 
        }}
        onCancel={() => setInfiltrateCard(null)}
      />
    )}

    <AnnouncementModal
      isOpen={!!announcement || !!gameOverData}
      onClose={() => {
        if (gameOverData) navigate('/');
        setAnnouncement(null);
      }}
      title={
        gameOverData 
          ? (isWinner ? "👑 ¡VICTORIA REAL!" : "💀 DERROTA ABSOLUTA") 
          : (announcement?.title || "")
      }
      message={
        gameOverData 
          ? (isWinner 
              ? `Habéis prevalecido. Razón: ${gameOverData.reason}` 
              : `Vuestras fuerzas han flaqueado. Razón: ${gameOverData.reason}`)
          : (announcement?.message || "")
      }
      onConfirm={undefined}
    />

    <ErrorToast 
      error={error} 
      onClose={() => setError("")} 
    />
  </div>
  );
}

export default Game;