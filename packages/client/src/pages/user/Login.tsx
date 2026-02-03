import { useUser } from "../../hooks/useUser";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { User } from  "../../context/AuthContext";

const Login = () => {
    const { addUser } = useUser();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                navigate("/home");
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
        <div>
            <h2>Register</h2>
            <form onSubmit = {handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    )

}

export default Login;