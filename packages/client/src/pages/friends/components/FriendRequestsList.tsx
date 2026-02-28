import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import "../SocialPanel.css"; 

interface FriendRequest {
    idFriendship: number;
    sender: {
        idUser: number;
        name: string;
    };
};

interface SocketRequestData {
    friendshipId: number,
    senderId: number;
    senderName: string;
};

export default function FriendRequestsList() {
    const { user, socket } = useAuth();
    const [requests, setRequests] = useState<FriendRequest[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchRequests = async () => {
            try {
                const res = await fetch(import.meta.env.VITE_API_URL+"/api/friendship/listFriendshipRequests", {
                    headers: { "Authorization": `Bearer ${user.authToken}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setRequests(data);
                }
            } catch (err) {
                console.error("Error listing requests", err);
            }
        };

        fetchRequests();
    }, [user]);

    useEffect(() => {
        if (!socket) return;

        socket.on("friendRequest", (newRequestData: SocketRequestData) => {
            console.log("New Friend Request!", newRequestData);
            
            const newReq: FriendRequest = {
                idFriendship: Date.now(), 
                sender: {
                    idUser: newRequestData.senderId,
                    name: newRequestData.senderName
                }
            };
            
            setRequests((prev) => [...prev, newReq]);
        });

        return () => {
            socket.off("friendRequest");
        };
    }, [socket]);
    //Habra que hacer que cuando se acepte, te salga directamente en la lista de amigos sin recargar
    const handleResponse = async (friendshipId: number, action: "ACCEPTED" | "DENIED") => {
        setRequests((prev) => prev.filter(req => req.idFriendship !== friendshipId));
        try {
            const res = await fetch(import.meta.env.VITE_API_URL+"/api/friendship/update", {
                method: "PUT",
                headers: { 
                    "Authorization": `Bearer ${user?.authToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({friendshipId, action})
            });
            if (!res) {
                throw new Error("Error updating friendship's status");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (requests.length === 0) return null; 

    return (
        <div className="social-panel">
            <h3>Friend Requests({requests.length})</h3>
            <div className="user-list">
                {requests.map((req) => (
                    <div key={req.idFriendship} className="user-card request">
                        <p><strong>{req.sender.name}</strong></p>
                        <div className="user-info">
                            <button onClick={() => handleResponse(req.idFriendship, "ACCEPTED")} className="action-btn btn-green">✔</button>
                            <button onClick={() => handleResponse(req.idFriendship, "DENIED")} className="action-btn btn-red">✖</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};