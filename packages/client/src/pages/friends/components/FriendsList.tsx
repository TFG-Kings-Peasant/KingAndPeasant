import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import "../SocialPanel.css";

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
                const res = await fetch(import.meta.env.VITE_API_URL+"/api/friendship/list", {
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
        <div className="social-panel"> {/* Reutilizamos la clase del contenedor */}
            <h3>My Friends ({friends.length})</h3>
            
            {friends.length === 0 ? (
                <p style={{ color: '#888' }}>You do not have any friends yet</p>
            ) : (
                <div className="user-list">
                    {friends.map((friend) => (
                        <div key={friend.idUser} className="user-card friend">
                            <div className="user-info">
                                <span className="user-name">🟢 {friend.name}</span>
                            </div>
                           
                            <button 
                                onClick={() => handleInvite(friend.idUser)} 
                                className="action-btn btn-blue" 
                            >
                                Play
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}