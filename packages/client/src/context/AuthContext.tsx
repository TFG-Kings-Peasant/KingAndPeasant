import { createContext, useState } from "react";
import type { ReactNode } from "react";
import { useLocalStorage} from "../hooks/useLocalStorage";

const { getItem, setItem, removeItem } = useLocalStorage();

export interface User {
    id: string;
    name: string;
    email: string;
    authToken?: string;
}

interface AuthContextType {
  user: User | null;
  isLogin: boolean;
  login: ( userData: User ) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem("user");
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