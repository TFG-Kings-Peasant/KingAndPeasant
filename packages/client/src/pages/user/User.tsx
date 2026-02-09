import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import "./User.css";

const User = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [games, setGames] = useState(0);
    const [wins, setWins] = useState(0);
    const [losses, setLosses] = useState(0);
    const [createdAt, setCreatedAt] = useState(null);
    const [error, setError] = useState<string | null>(null);

    const { user, isLogin } = useUser();

    useEffect (() => {
        
        if(!isLogin || !user) return;
        const localData = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/auth/profile", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${user.authToken}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setName(data.name);
                    setEmail(data.email);
                    setGames(data.games);
                    setWins(data.wins);
                    setLosses(data.losses);
                    setCreatedAt(data.createdAt);
                } else {
                    const data = await response.json();
                    setError(data.message || "Fetching user data failed");
                }
            } catch (err) {
                setError("An error ocurred: " + err + ". Please try again.")
            }
        }
        localData();
    }, [user, isLogin]);

    if (error) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-error">{error}</div>
                    <Link to="/" className="auth-link">Return to the Kingdom</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Lord Profile {name}</h2>

                <div className="profile-info">
                    <p className="profile-text">
                        <strong>Email:</strong> {email}
                    </p>
                    <p className="profile-date">
                        <strong>Joined on the:</strong> {createdAt ? new Date(createdAt).toLocaleDateString() : 'Desconocido'}
                    </p>
                </div>

                <hr className="profile-divider" />

                <h3 className="stats-title">War statistics</h3>
                
                <div className="stats-grid">

                    <div className="stat-box">
                        <span className="stat-icon">⚔️</span>
                        <strong className="stat-number">{games}</strong>
                        <div className="stat-label">Games</div>
                    </div>

                    <div className="stat-box">
                        <span className="stat-icon">🏆</span>
                        <strong className="stat-number win">{wins}</strong>
                        <div className="stat-label">Wins</div>
                    </div>

                    <div className="stat-box">
                        <span className="stat-icon">☠️</span>
                        <strong className="stat-number loss">{losses}</strong>
                        <div className="stat-label">Defeats</div>
                    </div>
                </div>

                <Link to="/editProfile" state={{name, email}} className="auth-button btn-block">
                    Edit my profile.
                </Link>

                <Link to="/" className="auth-link link-block">
                    Return to the Kingdom.
                </Link>

            </div>
        </div>
    );
} 

export default User;