import { useState } from "react";
import type { ReactNode } from "react";
import { useLocalStorage} from "../hooks/useLocalStorage";
import type { User } from "./AuthContext.ts"
import { AuthContext } from "./AuthContext.ts"

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { getItem, setItem, removeItem } = useLocalStorage();
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = getItem("user");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Error leyendo localStorage:", error);
            return null;
        }
    });
    const [isLogin, setIsLogin] = useState<boolean>(!!user);

    function login( userData: User) {
        setUser(userData);
        setIsLogin(true);
        setItem("user", JSON.stringify(userData));
    }

    function logout() {
        setIsLogin(false);
        setUser(null);
        removeItem("user");
    }

    const value = { user, isLogin, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}