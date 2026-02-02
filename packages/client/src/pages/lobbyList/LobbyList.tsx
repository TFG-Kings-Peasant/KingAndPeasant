import { useEffect, useState } from "react";
import Header from "../home/components/Header";
import './LobbyList.css'
import { getAllLobbies, type LobbyBackend } from "./components/LobbyFetch";
import { useNavigate } from "react-router";

function LobbyList() {
    const [lobbies, setLobbies] = useState<LobbyBackend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        fetchLobbies();
    }, []);

    const fetchLobbies = async () => {
        setLoading(true);
        try {
            const data = await getAllLobbies();
            setLobbies(data);
            setError("");
        } catch (err) {
            setError("Error cargando salas");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const joinLobbyCheck = (player2Id: number | null, privacy: string, status: string) => {
        if (status === 'ONGOING') {
            return {allowed: "not-allowed", reason: "EN JUEGO"};
        }
        if (privacy === 'PRIVATE') {
            return {allowed: "not-allowed", reason: "SALA PRIVADA"};
        }
        if (player2Id !== null) {
            return {allowed: "not-allowed", reason: "SALA LLENA"};
        }
        return {allowed: "allowed", reason: "UNIRSE"};
    };

    return <div>
        <Header username="Guille"/>
        <div className="body-container">
            <div className="button-container">
                <button>Crear Sala</button>
                <button onClick={fetchLobbies} disabled={loading}>
                        {loading ? "Cargando..." : "Refrescar"}
                </button>
            </div>

            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

            <div className="lobby-table">
                <div className="table-header">
                    <span>NOMBRE DE LA SALA</span>
                    <span>JUGADORES</span>
                    <span>PRIVACIDAD</span>
                    <span>ESTADO</span>
                    <span>UNIRSE</span>
                </div>
                <div className="table-body">
                    {lobbies.map((lobby) => {
                        const joinStatus = joinLobbyCheck(lobby.player2Id, lobby.privacy, lobby.status);
                        return(
                            <div key={lobby.id} className="table-row">
                            <span className="col-name">{lobby.name}</span>
                            <span className="col-players">{lobby.player2Id ? "2/2" : "1/2"}</span>
                            <span className="col-privacy">{lobby.privacy}</span>
                            <span className="col-status">{lobby.status}</span>
                            <span className="col-join">
                                <button className={`join-btn ${joinStatus.allowed}`} onClick={() => navigate(`/lobby/${lobby.id}`)} disabled={joinStatus.allowed === "not-allowed"}>
                                    {joinStatus.reason}
                                </button>
                            </span>
                        </div>
                        )
                    })}     
                </div>
            </div>
        </div>
    </div>;
}

export default LobbyList