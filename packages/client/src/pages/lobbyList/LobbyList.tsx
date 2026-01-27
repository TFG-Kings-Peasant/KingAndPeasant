import Header from "../home/components/Header";
import './LobbyList.css'

const mockLobbies = [
  { id: 1, name: "Sala de Principiantes", host: "HostUser_01", players: "1/2", status: "UNIRSE", type: "join" },
  { id: 2, name: "Partida Seria", host: "ProGamer", players: "1/2", status: "PRIVADA", type: "private" },
  { id: 3, name: "Test Room", host: "Dev", players: "2/2", status: "LLENA", type: "full" },
];

function LobbyList() {
    return <div>
        <Header username="Guille"/>
        <div className="body-container">
            <div className="button-container">
                <button>Crear Sala</button>
                <button>Refrescar</button>
            </div>
            <div className="lobby-table">
                <div className="table-header">
                    <span>NOMBRE DE LA SALA</span>
                    <span>ANFITRIÓN</span>
                    <span>JUGADORES</span>
                    <span>ESTADO</span>
                </div>
                <div className="table-body">
                    {mockLobbies.map((lobby) => (
                        <div key={lobby.id} className="table-row">
                            <span className="col-name">{lobby.name}</span>
                            <span className="col-host">{lobby.host}</span>
                            <span className="col-players">{lobby.players}</span>
                            <span className="col-status">
                                <button className={`status-btn ${lobby.type}`}>{lobby.status}</button>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>;
}

export default LobbyList