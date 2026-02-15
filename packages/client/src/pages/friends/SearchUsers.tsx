import { useState, useEffect } from "react"; 
import { useNavigate, Link } from "react-router-dom";
import { useAuth} from "../../hooks/useAuth";
import "./SearchUsers.css"
import FriendRequestsList from "./comonents/FriendRequestsList.tsx";
import FriendsList from "./comonents/FriendsList.tsx";

const SearchUsers = () => {
    const [searchQuery, setQuery] = useState("");
    const [users, setUsers] = useState<SearchResult[] | []>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
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
        setSuccess(false);
        setHasSearched(true);

        if (!searchQuery.trim()) {
            return;
        }

        try {
            const url = `http://localhost:3000/api/auth/search?query=${encodeURIComponent(searchQuery)}`;

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

    return ( <div className="auth-container">
                <div className="friends-layout">
                    <div className="auth-card">
                        <h2 className="auth-title">Search for a user</h2>
        
                        {success && <div style={{ color: 'green', marginBottom: '10px' }}>!</div>}
                        {error && <div className="auth-error">{error}</div>}
        
                        <form className="auth-form" onSubmit={handleSubmit}>
                            
                            <div style={{ textAlign: "left", marginBottom: "10px" }}>
                                <label style={{ fontWeight: "bold", fontSize: "0.9rem" }}>Lord's Name</label>
                                <input
                                    className="auth-input"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setQuery(e.target.value)}
                                    required
                                />
                            </div>

                            <button className="auth-button" type="submit">
                                Find Users
                            </button>

                            <div className="results-list">
                                {users.length > 0 ? (
                                    users.map((friend) => (
                                        <div key={friend.idUser} className="user-card">
                                            <div className="user-info">
                                                <span className="user-name">{friend.name}</span>
                                                <span className="user-email">{friend.email}</span>
                                            </div>
                                            <button 
                                                className="add-friend-btn"
                                                onClick={() => handleSendRequest(friend.idUser)}
                                            >
                                                Añadir +
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    // Solo mostramos esto si ya buscó y no encontró nada
                                    hasSearched && !error && <p className="no-results">No se encontraron usuarios.</p>
                                )}
                            </div>
                    
                            <Link to="/" className="auth-link" style={{ display: 'block', marginTop: '15px' }}>
                                Go back to Home
                            </Link>
                        </form>
                    </div>
                    <div className="auth-card">
                        <FriendRequestsList />
                    </div>
                    <div className="auth-card">
                        <FriendsList />
                    </div>
                </div>
            </div>
        );
};

export default SearchUsers;