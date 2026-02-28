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
        <ParchmentCard title="Login to the Kingdom">
                <form className="menu-form" onSubmit = {handleSubmit}>
                    <FormInput
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <FormInput
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <MenuButton type="submit">Login</MenuButton>
                </form>
                {error && <div className="menu-error">{error}</div>}

                <Link to="/register" className="menu-link">
                    Don't you have a crown yet? Register here
                </Link>

                <Link to="/" className="menu-link">
                    Return to the kingdom
                </Link>
        </ParchmentCard>
    )

}

export default Login;