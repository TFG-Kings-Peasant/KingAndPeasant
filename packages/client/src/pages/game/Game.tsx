import { useEffect, useRef, useState } from "react";
import { getGameStateById, getPosibleActions, playCard, resolvePendingAction, type CardState, type GameState } from "./components/GameService";
import "./GameChat.css";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./Game.css";
import { CARDS_THAT_CAN_INFILTRATE, peasantPendingUI, kingPendingUI } from "./components/pendingActionsUI";
import type { SelectedCard } from "./components/pendingActionsUI";

interface ChatMessage {
  sender: string;
  text: string;
}

function Game() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedCard, setSelectedCard] = useState<CardState | null>(null);
  const [actionTargets, setActionTargets] = useState<SelectedCard[]>([]);
  const activeConfig = gameState?.pendingAction
    ? (gameState.pendingAction.player === "king" 
        ? kingPendingUI[gameState.pendingAction.type] 
        : peasantPendingUI[gameState.pendingAction.type])
    : null;
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {socket, user} = useAuth()

  const [gameOverData, setGameOverData] = useState<{
    isGameOver: boolean;
    winnerId: number;
    reason: string;  
  } | null>(null);

  const fetchGameState = async () => {
    try {
      if(!id || !user || !user.authToken) return;
      const data = await getGameStateById(Number(id), user?.authToken);
      setGameState(data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el estado del juego");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setActionTargets([]);
  }, [gameState?.pendingAction?.type]);

  useEffect(() => {
    if (!socket) {
        console.log("Socket no disponible aún...");
        return;
    }

    const handleReceiveMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleGameStateUpdate = (newGameState: GameState) => {
        console.log("=== TABLERO ACTUALIZADO VÍA SOCKET ===", newGameState);
        setGameState((prevState) => {
            // Si YA teníamos una partida en pantalla y la nueva Era es mayor...
            if (prevState && newGameState.era > prevState.era) {
                alert(`🚩 ¡FIN DE LA ERA!\nAlguien ha ganado la Era ${prevState.era}.\n\n¡Comienza la Era ${newGameState.era} y se han intercambiado los roles!`);
            }
            // Devolvemos el nuevo estado para que React actualice la pantalla
            return newGameState; 
        });
    };

    socket.emit('joinGame', `game_${id}`);
    socket.on('gameState', handleGameStateUpdate);

    socket.on('receiveChatMessage', handleReceiveMessage);

    socket.on('game:finished', (data) => {
        console.log("=== PARTIDA TERMINADA ===", data);
        setGameOverData(data); 
    });

    return () => {
      socket.off('gameState', fetchGameState);
      socket.off('receiveChatMessage', handleReceiveMessage);
      socket.off('game:finished');
    };

  }, [socket, id]);

  useEffect(() => {
    fetchGameState();
  }, [id]);

  

  if (loading || !gameState || !user) return <div>Cargando el Tablero...</div>;

  const isKing = Number(user.id) === gameState.players.king.id;
  const myPlayer = isKing ? gameState.players.king : gameState.players.peasant;
  const rivalPlayer = isKing ? gameState.players.peasant : gameState.players.king;

  const myRoleName = isKing ? "king" : "peasant";
  const rivalRoleName = isKing ? "peasant" : "king";
  const pendingAction = gameState.pendingAction && gameState.pendingAction.player == myRoleName? true: false;
  
  const myScore = gameState.scores[String(user.id)] || 0;
  const rivalScore = gameState.scores[String(rivalPlayer.id)] || 0;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault(); 
    
    if (!currentMessage.trim() || !socket || !id || !user) return;

    const newMsg: ChatMessage = {
      sender: user.name, 
      text: currentMessage,
    };

    socket.emit('sendChatMessage', { 
      room: `game_${id}`, 
      sender: newMsg.sender, 
      text: newMsg.text 
    });

    setMessages((prev) => [...prev, newMsg]);
    setCurrentMessage("");
  };
  
  const handleSelectCard = (card: CardState, position: 'hand' | 'myTown' | 'rivalTown' | 'deck' | 'discard'| null) => {
    if(activeConfig && position && activeConfig.allowedZones.includes(position)){
      const isRevolt = gameState?.pendingAction?.type === 'REVOLT';
      const isValidTarget = !isRevolt || CARDS_THAT_CAN_INFILTRATE.includes(card.templateId as number);

      if (isValidTarget) {
        setActionTargets(prev => {
          const exists = prev.find(t => t.uid === card.uid);
          if (exists) return prev.filter(t => t.uid !== card.uid);
          const targetedCard: SelectedCard = {...card, position: position};
          return [...prev, targetedCard];
        });
        return;
      }
    }
    if(position) {
      card.position = position;
    }
    setSelectedCard(card);
  }

  const handlePlayCard = async () => {
    if(!id || !user || !user.authToken || !gameState || !selectedCard) return;
    if(gameState.turn !== myRoleName) {
      alert("No es tu turno");
      return;
    }
    const cardToPlayUid = selectedCard.uid;
    setSelectedCard(null);
    try {
      await playCard(Number(id), cardToPlayUid, {}, user.authToken)
      setSelectedCard(null);
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Ocurrió un error desconocido");
      }
      setError("Error jugando una carta")
    }
  }

  const handleResolvePending = async (targetData: Record<string, unknown>) => {
    if(!id || !user || !user.authToken || !gameState) return;
    if(gameState.turn !== myRoleName) {
      alert("No es tu turno");
      return;
    }
    try {
      await resolvePendingAction(Number(id), targetData, user.authToken)
      
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Ocurrió un error desconocido");
      }
      setError("Error jugando una carta")
    }
  }

  return (
  <div className="game-board">
    <div className="game-main-area">
      
      <div className="opponent-area">
        <h3>RIVAL ({rivalRoleName})</h3>
        <div className="hand">
          {rivalPlayer.hand.map((card) => (
            <div key={card.uid} className="card ingame back"></div>
          ))}
        </div>
        <div className="town">
          {rivalPlayer.town.map((card) => {
            const isSelected = actionTargets.some(t => t.uid === card.uid);
            return (
              <div key={card.uid} className={`card ingame ${isSelected ? 'selected-target' : ''}`} style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }} 
              onClick={() => handleSelectCard(card, 'rivalTown')}>
              </div>
            );
          })}
        </div>
      </div>

      <div className="player-area">
        <div className="town">
          {myPlayer.town.map((card) => {
            const isSelected = actionTargets.some(t => t.uid === card.uid);
            return(
              <div key={card.uid} className= {`card ingame ${!card.templateId ? 'back' : ''} ${isSelected ? 'selected-target' : ''}`} style={{ backgroundImage: card.templateId ? `url('/cards/${card.templateId}.png')` : undefined }} 
              onClick={() => handleSelectCard(card, 'myTown')}>
                {isSelected && gameState?.pendingAction?.type === 'REVOLT' && (
                   <input 
                     type="number" 
                     min="0" max={gameState.deckCount}
                     className="revolt-position-input"
                     onClick={(e) => e.stopPropagation()} // Evita que el click quite la selección de la carta
                     onChange={(e) => {
                       const pos = parseInt(e.target.value) || 0;
                       setActionTargets(prev => prev.map(t => t.uid === card.uid ? { ...t, chosenPosition: pos } : t));
                     }}
                   />)}
              </div>
            );
          })}
        </div>
        
        <div className={`hand ${gameState.turn !== myRoleName ? 'waiting-turn' : ''}`}>
          {myPlayer.hand.map((card) => {
            const isSelected = actionTargets.some(t => t.uid === card.uid);
            const isClickable = gameState?.pendingAction && activeConfig?.allowedZones.includes("hand");

            return (
              <div 
                key={card.uid} 
                className={`card ingame ${isSelected ? 'selected-target' : ''} ${isClickable ? 'clickable' : ''}`}
                style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }} 
                onClick={() => handleSelectCard(card, "hand")}
              ></div>
            );
          })}
        </div>
        <h3>TU MANO ({myRoleName}) - Turno: {gameState.turn.toUpperCase()}</h3>
      </div>
    </div>

    <div className="game-sidebar">
      <div className="score-board" style={{ backgroundColor: '#2c2c2c', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '2px solid #d4af37' }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#d4af37', fontSize: '1.5rem' }}>ERA {gameState.era}</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
              <div>
                  <span style={{ display: 'block', color: '#aaa', fontSize: '0.8rem' }}>Tus Victorias</span>
                  <strong style={{ fontSize: '1.2rem'}}>{myScore} / 2</strong>
              </div>
              <div>
                  <span style={{ display: 'block', color: '#aaa', fontSize: '0.8rem' }}>Rival</span>
                  <strong style={{ fontSize: '1.2rem'}}>{rivalScore} / 2</strong>
              </div>
          </div>
      </div>

      <div className="deck-pile">
        <span>MAZO</span>
        <strong>{gameState.deckCount}</strong>
      </div>
      
      <div className="discard-pile" onClick={() => setShowDiscardModal(true)}>
          <h3>DESCARTES</h3>
          <p>{gameState.discardPile?.length || 0}</p>
        </div>

      <div className="action-container">
        {/*<button className = "button ingame" onClick={handleMakeAction}>PASAR TURNO</button>*/}

      <div className="chat-container">
        <h3 className="chat-header">
          Chat de Partida
        </h3>
        
        <div className="chat-messages-area">
          {messages.map((msg, index) => (
            <div key={index} className="chat-message">
              <strong className="chat-sender">{msg.sender}: </strong>
              <span>{msg.text}</span>
            </div>
          ))}
          {messages.length === 0 && <p className="chat-empty">Aún no hay mensajes.</p>}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chat-form">
          <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="Escribe un mensaje..."
            className="chat-input"
          />
          <button type="submit" className="chat-submit-btn">
            Enviar
          </button>
        </form>
      </div>
      </div>
    </div>
    
    {pendingAction && activeConfig && (
      <div className="pending-action-overlay">
        <div className="pending-action-content">
          <h2>⚔️ ¡Acción: {gameState.pendingAction?.type}!</h2>
          {/* Mostramos las instrucciones desde el diccionario */}
          <p>{activeConfig.instructionText}</p>
          
          {/* Botón dinámico que se desactiva si canConfirm es false */}
          <button 
            className="button ingame"
            style={{ backgroundColor: activeConfig.canConfirm(actionTargets) ? '#d4af37' : '#555' }}
            disabled={!activeConfig.canConfirm(actionTargets)}
            onClick={() => {
              const payload = activeConfig.formatPayload(actionTargets);
              handleResolvePending(payload);
              setActionTargets([]); 
              setSelectedCard(null);
            }}
          >
            Confirmar Acción
          </button>
        </div>
      </div>
    )}

    {/* --- NUEVO: MODAL DE CARTA AMPLIADA --- */}
    {selectedCard && (
      <div className="card-modal-overlay" onClick={() => setSelectedCard(null)}>
        {/* Al hacer click en el contenido evitamos que se cierre (propagation) */}
        <div className="card-modal-content" onClick={(e) => e.stopPropagation()}>
          <div 
            className="card zoomed" 
            style={{ backgroundImage: `url('/cards/${selectedCard.templateId}.png')` }}
          ></div>
          {gameState.turn === myRoleName && selectedCard.position === "hand" && (
          <button
            onClick={handlePlayCard}
            className="button ingame"
          >
            {getPosibleActions(selectedCard, isKing)}
          </button>
          )}
        </div>
      </div>
    )}

    {error && <p className="error-msg">{error}</p>}

    {gameOverData && (
      <div className="card-modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card-modal-content" style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '10px', color: '#000' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>
                {gameOverData.winnerId === Number(user?.id) 
                    ? '👑 ¡HAS GANADO!' 
                    : '💀 HAS PERDIDO'}
            </h1>
            
            <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                Motivo: <strong>{gameOverData.reason}</strong>
            </p>
            
            <button 
                onClick={() => navigate('/')} // Te lleva al inicio
                className="button ingame"
                style={{ padding: '10px 20px', fontSize: '1.1rem', cursor: 'pointer' }}
            >
                Volver al Menú Principal
            </button>
        </div>
      </div>
    )}

    {showDiscardModal && (
      <div className="card-modal-overlay" onClick={() => setShowDiscardModal(false)}>
        {/* El stopPropagation evita que al hacer clic dentro del recuadro se cierre el modal */}
        <div className="discard-modal-content" onClick={(e) => e.stopPropagation()}>
          <h2>Mazo de Descartes</h2>
          <div className="discard-grid">
            
            {gameState.discardPile?.length === 0 ? (
              <p>El mazo de descartes está vacío.</p>
            ) : (
              gameState.discardPile?.map((card, index) => {
                // Comprobamos si la carta está seleccionada para brillar
                const isSelected = actionTargets.some(t => t.uid === card.uid);
                // Comprobamos si la acción actual permite clickar en el descarte
                const isClickable = gameState?.pendingAction && activeConfig?.allowedZones.includes('discard');

                return (
                  <div
                    key={`${card.uid}-${index}`}
                    className={`card ingame ${isSelected ? 'selected-target' : ''} ${isClickable ? 'clickable' : ''}`}
                    style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }}
                    onClick={() => {
                      // Solo permite seleccionar la carta si la acción lo requiere, o ampliarla si no hay acción
                      if (isClickable) {
                        handleSelectCard(card, 'discard');
                      } else {
                        setSelectedCard(card);
                      }
                    }}
                  ></div>
                );
              })
            )}

          </div>
          <button 
            className="button ingame" 
            style={{ marginTop: '20px', width: 'auto', padding: '10px 20px' }} 
            onClick={() => setShowDiscardModal(false)}
          >
            Cerrar
          </button>
        </div>
      </div>
    )}

  </div>
  );
}

export default Game;