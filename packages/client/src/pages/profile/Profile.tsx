import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import "../../components/ParchmentMenu.css";

const Profile = () => {
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
                const response = await fetch(import.meta.env.VITE_API_URL+"/api/auth/profile", {
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
            <div className="page-shell page-shell--centered">
                <div className="page-content page-content--narrow">
                <div className="menu-card">
                    <div className="menu-error">{error}</div>
                    <div className="menu-links">
                        <Link to="/" className="menu-link">Return to the Kingdom</Link>
                    </div>
                </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <div className="page-content page-content--narrow">
            <div className="menu-card profile-card">
                <div className="menu-header">
                    <span className="page-eyebrow profile-eyebrow">Profile</span>
                    <h2 className="menu-title">Lord Profile {name}</h2>
                    <p className="menu-subtitle">
                        Toda tu información importante queda reunida aquí, con más aire visual y estadísticas
                        mejor agrupadas.
                    </p>
                </div>

                <div className="profile-info-grid">
                    <div className="profile-info-card">
                        <span className="profile-meta-label">Email</span>
                        <p className="profile-text">{email}</p>
                    </div>
                    <div className="profile-info-card">
                        <span className="profile-meta-label">Joined on</span>
                        <p className="profile-date">
                            {createdAt ? new Date(createdAt).toLocaleDateString() : 'Desconocido'}
                        </p>
                    </div>
                </div>

                <hr className="profile-divider" />

                <div className="section-heading profile-stats-heading">
                    <h3 className="stats-title">War statistics</h3>
                    <p>Consulta tu actividad reciente y tus resultados de un vistazo.</p>
                </div>
                
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

                <div className="profile-actions">
                    <Link to="/editProfile" state={{name, email}} className="menu-button btn-block">
                        Edit my profile
                    </Link>

                    <Link to="/" className="menu-link link-block">
                        Return to the Kingdom
                    </Link>
                </div>

            </div>
            </div>
        </div>
    );
} 

export default Profile;
