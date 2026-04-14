import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useGameData } from "../../hooks/useGameData";
import { useGameActions } from "../../hooks/useGameActions";
import { getPosibleActions, type CardPosition, type CardState } from "./components/GameService";
import { CARDS_THAT_CAN_INFILTRATE, peasantPendingUI, kingPendingUI } from "./components/pendingActionsUI";
import type { SelectedCard } from "./components/pendingActionsUI";

// Componentes
import { DisconnectBanner } from "./components/DisconnectBanner"; // <-- NUEVO
import { InfiltrateModal } from "./components/InfiltrateModal";
import { CardDetailModal } from "./components/CardDetailModal";
import { GameOverModal } from "./components/GameOverModal";
import { DiscardModal } from "./components/DiscardModal";
import { DeckModal } from "./components/DeckModal";
import { PendingActionModal } from "./components/PendingActionModal";
import { RivalArea } from "./components/RivalArea";
import { PlayerArea } from "./components/PlayerArea";
import { GameSidebar } from "./components/GameSidebar";
import { ErrorToast } from "./components/ErrorToast";

import "./Game.css";
import "./GameChat.css";

function Game() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { socket, user } = useAuth()
  const { gameState, loading, error, setError, gameOverData } = useGameData(id, user, socket);
  
  const [selectedCard, setSelectedCard] = useState<CardState | null>(null);
  const [actionTargets, setActionTargets] = useState<SelectedCard[]>([]);
  const [numberInput, setNumberInput] = useState<number | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [infiltrateCard, setInfiltrateCard] = useState<SelectedCard | null>(null);

  const activeConfig = gameState?.pendingAction
    ? (gameState.pendingAction.player === "king" 
        ? kingPendingUI[gameState.pendingAction.type] 
        : peasantPendingUI[gameState.pendingAction.type])
    : null;

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

  const myRoleName = isKing ? "king" : "peasant";
  const rivalRoleName = isKing ? "peasant" : "king";
  const pendingAction = gameState.pendingAction && gameState.pendingAction.player === myRoleName;
  
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
      
      {/* Componente del Temporizador Aislado */}
      <DisconnectBanner socket={socket} />

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

      {gameOverData && (
        <GameOverModal 
          gameOverData={gameOverData}
          userId={Number(user.id)}
          onNavigateHome={() => navigate('/')}
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

      <ErrorToast 
        error={error} 
        onClose={() => setError("")} 
      />
    </div>
  );
}

export default Game;