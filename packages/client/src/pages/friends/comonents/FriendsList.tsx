import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import "./FriendRequests.css";

interface User {
    idUser: number;
    name: string;
}

export default function FriendsList() {
    const { user } = useAuth();
    const [friends, setFriends] = useState<User[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchFriends = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/friendship/list", {
                    headers: { "Authorization": `Bearer ${user.authToken}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setFriends(data);
                }
            } catch (err) {
                console.error("Error cargando amigos", err);
            }
        };

        fetchFriends();
    }, [user]);

    // Función placeholder para el futuro (Chat, Invitar a jugar, etc.)
    const handleInvite = (friendId: number) => {
        console.log("Invitando a jugar a:", friendId);
    };

    return (
        <div className="requests-container"> {/* Reutilizamos la clase del contenedor */}
            <h3>Mis Amigos ({friends.length})</h3>
            
            {friends.length === 0 ? (
                <p style={{ color: '#888' }}>Aún no tienes amigos agregados.</p>
            ) : (
                <div className="requests-list">
                    {friends.map((friend) => (
                        <div key={friend.idUser} className="request-card">
                            <div className="friend-info">
                                <span className="friend-name">🟢 {friend.name}</span>
                            </div>
                            <div className="request-actions">
                                {/* Botón para futura funcionalidad */}
                                <button 
                                    onClick={() => handleInvite(friend.idUser)} 
                                    className="btn-accept" 
                                    style={{ backgroundColor: '#3b82f6' }} // Azul para diferenciar
                                >
                                    Jugar 🎮
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}