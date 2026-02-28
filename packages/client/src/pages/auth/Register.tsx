import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../components/ParchmentMenu.css";

import { ParchmentCard } from "../../components/ParchmentCard";
import { FormInput } from "../../components/FormInput";
import { MenuButton } from "../../components/MenuButton";


const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        fetch(import.meta.env.VITE_API_URL+"/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, password }),
        })
        .then(async (res) => {
            if (res.ok) {
                navigate("/login");
            } else {
                const data = await res.json();
                setError(data.message || "Registration failed");
            }
        })
        .catch((err) => {
            setError("An error occurred:" + err +". Please try again.");
        });
    };

    return (
        <ParchmentCard title="New Lord">
            <form className="menu-form" onSubmit={handleSubmit}>
                <FormInput
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
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
                <MenuButton type="submit">Register</MenuButton>
            </form>
            {error && <div className="menu-error">{error}</div>}

            <Link to="/login" className="menu-link">
                Do you already have a crown? Enter here
            </Link>

            <Link to="/" className="menu-link">
                Return to the kingdom
            </Link>
        </ParchmentCard>
    );      
}

export default Register;