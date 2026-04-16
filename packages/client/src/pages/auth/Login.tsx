import { useUser } from "../../hooks/useUser";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import type { User } from  "../../context/AuthContext";
import "../../components/ParchmentMenu.css";

import { ParchmentCard } from "../../components/ParchmentCard";
import { FormInput } from "../../components/FormInput";
import { MenuButton } from "../../components/MenuButton";

const Login = () => {
    const { login } = useUser();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        fetch(import.meta.env.VITE_API_URL+"/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        })
        .then(async (res) => {
            if (res.ok) {
                const data = await res.json();

                const user : User = {
                    id: data.userId,
                    name: data.name,
                    email: data.email,
                    authToken: data.authToken
                }

                login(user!);
                navigate("/");
            } else {
                const data = await res.json();
                setError(data.message || "Login failed");
            }
        })
        .catch((err) => {
            setError("An error occurred:" + err +". Please try again.");
        });
    };
    
    return (
        <ParchmentCard
            title="Login to the Kingdom"
            subtitle="Accede a tu cuenta para volver al reino, revisar tu perfil y entrar a partida sin rodeos."
        >
                <form className="menu-form" onSubmit = {handleSubmit}>
                    <div className="menu-section">
                        <label className="menu-field-label">Email</label>
                        <FormInput
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="menu-section">
                        <label className="menu-field-label">Password</label>
                        <FormInput
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <MenuButton type="submit">Login</MenuButton>
                </form>
                {error && <div className="menu-error">{error}</div>}

                <div className="menu-links">
                    <Link to="/register" className="menu-link">
                        Don't you have a crown yet? Register here
                    </Link>
                    <Link to="/" className="menu-link">
                        Return to the kingdom
                    </Link>
                </div>
        </ParchmentCard>
    )

}

export default Login;
