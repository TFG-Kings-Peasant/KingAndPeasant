import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import "./User.css"; // Reutilizamos estilos

const EditUser = () => {
    const { user, isLogin, login } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    // 1. RECUPERAR DATOS: Intentamos leer del 'state' (lo que viene de User.tsx)
    // Si no hay state (ej. recargó página), usamos el contexto o string vacío.
    const initialName = location.state?.name || user?.name || "";
    const initialEmail = location.state?.email || user?.email || "";

    const [name, setName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState(""); // La contraseña siempre empieza vacía
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Redirigir si no está logueado
    useEffect(() => {
        if (!isLogin) navigate("/login");
    }, [isLogin, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch("http://localhost:3000/api/auth/edit-profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user?.authToken}`
                },
                body: JSON.stringify({
                    name,
                    email,
                    // Solo enviamos la contraseña si el usuario escribió algo
                    password: password.length > 0 ? password : undefined 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error al actualizar perfil");
            }

            // 2. ACTUALIZAR CONTEXTO: ¡Importante!
            // Actualizamos la "cookie" local con los nuevos datos del servidor
            if (user) {
                login({
                    ...user,
                    name: data.name, // Asegúrate de que tu backend devuelve el nombre nuevo
                    email: data.email
                });
            }

            setSuccess(true);
            setTimeout(() => navigate("/user"), 1500); // Volver al perfil tras 1.5s

        } catch (err) {
            setError("An error ocurred: " + err + ". Please try again.")
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Editar Perfil</h2>

                {success && <div style={{ color: 'green', marginBottom: '10px' }}>¡Cambios guardados!</div>}
                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    
                    {/* Campo NOMBRE */}
                    <div style={{ textAlign: "left", marginBottom: "10px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "0.9rem" }}>Nombre de Lord</label>
                        <input
                            className="auth-input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Campo EMAIL */}
                    <div style={{ textAlign: "left", marginBottom: "10px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "0.9rem" }}>Correo Real</label>
                        <input
                            className="auth-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Campo CONTRASEÑA */}
                    <div style={{ textAlign: "left", marginBottom: "20px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "0.9rem" }}>Nueva Contraseña</label>
                        <input
                            className="auth-input"
                            type="password"
                            placeholder="Dejar vacía para mantener la actual"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <small style={{ color: "#666", fontSize: "0.8rem" }}>
                            * Si no quieres cambiar tu clave, no escribas nada aquí.
                        </small>
                    </div>

                    <button className="auth-button" type="submit">
                        Guardar Cambios
                    </button>

                    <Link to="/user" className="auth-link" style={{ display: 'block', marginTop: '15px' }}>
                        Cancelar
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default EditUser;