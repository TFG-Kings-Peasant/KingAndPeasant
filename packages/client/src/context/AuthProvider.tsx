import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useLocalStorage} from "../hooks/useLocalStorage.ts";
import type { User } from "./AuthContext.ts"
import { AuthContext } from "./AuthContext.ts"
import { io, Socket } from "socket.io-client"; 

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
    const [socket, setSocket] = useState<Socket | null>(null); 
    
    useEffect(() => {
        if (!user) 
    }, [user]);

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

    const value = { user, isLogin, login, logout, socket };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}