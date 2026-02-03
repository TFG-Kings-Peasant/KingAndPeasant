import PlayerCard from "./components/PlayerCard";
import "./Lobby.css";

function Lobby() {

  return (
    <div className="lobby-page">
      <h1>Lobby Page</h1>
      <div className="lobby-body">
        <PlayerCard name="Jugador 1" avatar="avatar1.png" status="Listo" />
        <h1>VS</h1>
        <PlayerCard name="Jugador 2" avatar="avatar2.png" status="Esperando" />
      </div>
      <div className="lobby-footer">
        <p>El destino está eligiendo tu rol...</p>
      </div>
    </div>
  );
}

export default Lobby;