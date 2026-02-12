import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.ts";


export const useUser = () => {

    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useUser must be used within an AuthProvider");
    }

    return {
       user: context.user, 
       login: context.login,      // Alias para mantener compatibilidad con tu código
       logout: context.logout,  // Alias para mantener compatibilidad
       isLogin: context.isLogin
    }

}
