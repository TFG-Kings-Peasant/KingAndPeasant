import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import SearchUsers from "./comonents/SearchUsers"; 
import FriendRequestsList from "./comonents/FriendRequestsList";
import FriendsList from "./comonents/FriendsList";

import "./Dashboard.css";

const Dashboard = () => {
    const { user, isLogin } = useAuth();
    const navigate = useNavigate();

    // Protección de ruta: Si no está logueado, fuera
    useEffect(() => {
        if (!isLogin) navigate("/login");
    }, [isLogin, navigate]);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Welcome, {user?.name || "Viajero"} .</h1>
                <p className="dashboard-subtitle"></p>
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
            
            <Link to="/" className="auth-link link-block">
                Return to the Kingdom.
            </Link>

        </div>
    );
};

export default Dashboard;