import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import { useAuth} from "../../../hooks/useAuth.ts";
import "../SocialPanel.css";

const SearchUsers = () => {
    const [searchQuery, setQuery] = useState("");
    const [users, setUsers] = useState<SearchResult[] | []>([]);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [sentRequests, setSentRequests] = useState<number[]>([]);

    const { user, isLogin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
    if(!isLogin) navigate("/login");
    }, [isLogin, navigate]);

    interface SearchResult {
        idUser: number;
        name: string;
        email: string;
    }   

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setHasSearched(true);

        if (!searchQuery.trim()) {
            return;
        }

        try {
            const url = import.meta.env.VITE_API_URL+`/api/auth/search?query=${encodeURIComponent(searchQuery)}`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user?.authToken}`
                }
            });

            const data: SearchResult[] = await response.json();
            setUsers(data);
            console.log(users);

            if (!response.ok) {
                const errorData = data as unknown as { message: string };
                throw new Error(errorData.message || "Error fetching users");
            }

            console.log("Users found:", data);
        } catch(err) {
            console.error(err);
            setError("An error ocurred while searching for users: " + err + ". Please try again.")
        }
    };

    const handleSendRequest = async (friendId: number) => {
        
        if (sentRequests.includes(friendId)) return;
        
        try {
        const response = await fetch("http://localhost:3000/api/friendship/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user?.authToken}` // Tu token
            },
            body: JSON.stringify({ 
                receiverId: friendId 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Error al enviar la solicitud");
        }

        setSentRequests((prev) => [...prev, friendId]);
        console.log("Friend request sent to:", friendId);

    } catch(err) {
        console.error(err);
        setError("An error ocurred while sending the friend request: " + err + ". Please try again.")
    }
        // Aquí conectaremos el socket/api en el siguiente paso
    };

    return (<div className="social-panel">
                <h2>Search for a user</h2>
                <p className="social-panel-intro">
                    Localiza jugadores por nombre y envía solicitudes sin salir del panel principal.
                </p>
                <form className="search-form" onSubmit={handleSubmit}>
                    <div className="search-field">
                        <label className="social-label">Lord's Name</label>
                        <input
                            className="social-input"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setQuery(e.target.value)}
                            required
                        />
                    </div>
                
                    <button className="action-btn btn-gold" type="submit">
                        Find Users
                    </button>
                </form>

                {error && <p className="social-empty">{error}</p>}

                <div className="user-list">
                    {users.length > 0 ? (
                        users.map((friend) => (
                            <div key={friend.idUser} className="user-card result">
                                <div className="user-info">
                                    <span className="user-name">{friend.name}</span>
                                    <span className="user-email">{friend.email}</span>
                                </div>
                                <button 
                                    className={`action-btn ${sentRequests.includes(friend.idUser) ? "btn-green" : "btn-gold"}`}
                                    onClick={() => handleSendRequest(friend.idUser)}
                                    disabled={sentRequests.includes(friend.idUser)}
                                >
                                    {sentRequests.includes(friend.idUser) ? "Sent" : "Add +"}
                                </button>
                            </div>
                        ))
                    ) : (
                        hasSearched && !error && <p className="social-empty">Users not found!</p>
                    )}
                </div>
            </div>
        );
};

export default SearchUsers;
