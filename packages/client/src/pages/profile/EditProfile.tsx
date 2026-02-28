import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import "../../components/ParchmentMenu.css";

const EditProfile = () => {
    const { user, isLogin, login } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    const initialName = location.state?.name || user?.name || "";
    const initialEmail = location.state?.email || user?.email || "";

    const [name, setName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState("");
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isLogin) navigate("/login");
    }, [isLogin, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch(import.meta.env.VITE_API_URL+"/api/auth/edit-profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user?.authToken}`
                },
                body: JSON.stringify({
                    name,
                    email,
                    password: password.length > 0 ? password : undefined 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error updating profile");
            }

            
            if (user) {
                login({
                    ...user,
                    name: data.name, 
                    email: data.email
                });
            }

            navigate("/profile");

        } catch (err) {
            console.error(err)
            setError("An error ocurred: " + err + ". Please try again.")
        }
    };

    return (
        <div className="menu-container">
            <div className="menu-card">
                <h2 className="menu-title">Edit Profile</h2>

                {success && <div style={{ color: 'green', marginBottom: '10px' }}>¡Changes saved!</div>}
                {error && <div className="menu-error">{error}</div>}

                <form className="menu-form" onSubmit={handleSubmit}>
                    
                    <div style={{ textAlign: "left", marginBottom: "10px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "0.9rem" }}>Lord's Name</label>
                        <input
                            className="menu-input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ textAlign: "left", marginBottom: "10px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "0.9rem" }}>Lord's Email</label>
                        <input
                            className="menu-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ textAlign: "left", marginBottom: "20px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "0.9rem" }}>New Password</label>
                        <input
                            className="menu-input"
                            type="password"
                            placeholder="Leave empty to keep the current one"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <small style={{ color: "#666", fontSize: "0.8rem" }}>
                            * Leave empty to keep the current one.
                        </small>
                    </div>

                    <button className="menu-button" type="submit">
                        Save Changes
                    </button>

                    <Link to="/profile" className="menu-link" style={{ display: 'block', marginTop: '15px' }}>
                        Cancel
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;