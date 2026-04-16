import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import SearchUsers from "./components/SearchUsers"; 
import FriendRequestsList from "./components/FriendRequestsList";
import FriendsList from "./components/FriendsList";

import "./Dashboard.css";

const Dashboard = () => {
    const { user, isLogin } = useAuth();
    const navigate = useNavigate();

    // Protección de ruta: Si no está logueado, fuera
    useEffect(() => {
        if (!isLogin) navigate("/login");
    }, [isLogin, navigate]);

    return (
        <div className="page-shell dashboard-shell">
            <div className="page-content">
            <header className="dashboard-header page-panel">
                <span className="page-eyebrow">Social</span>
                <h1 className="page-title">Welcome, {user?.name || "Viajero"}</h1>
                <p className="page-subtitle">
                    Busca jugadores, responde solicitudes pendientes y mantén a tus amistades siempre a mano.
                </p>
            </header>

            <div className="dashboard-grid">
                
                <div className="dashboard-column main-column">
                    <SearchUsers />
                </div>

                <div className="dashboard-column sidebar-column">
                    <div className="social-block">
                        <FriendRequestsList />
                    </div>
                    
                    <div className="social-block">
                        <FriendsList />
                    </div>
                </div>

            </div>
            
            <div className="dashboard-footer">
                <Link to="/" className="page-link">
                    Return to the Kingdom
                </Link>
            </div>

            </div>
        </div>
    );
};

export default Dashboard;
