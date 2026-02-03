import { useUser } from "../../hooks/useUser";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import type { User } from  "../../context/AuthContext";
import "./Auth.css";

const Login = () => {
    const { addUser } = useUser();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        fetch("http://localhost:3000/api/auth/login", {
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

                addUser(user!);
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
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Welcome Lord</h2>
                <form className="auth-form" onSubmit = {handleSubmit}>
                    <input
                        className="auth-input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        className="auth-input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button className="auth-button" type="submit">Login</button>
                </form>
                {error && <div className="auth-error">{error}</div>}

                <Link to="/register" className="auth-link">
                    Don't you have a crown yet? Register here
                </Link>

            </div>
        </div>
    )

}

export default Login;