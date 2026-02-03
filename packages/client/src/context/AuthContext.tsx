import { createContext, useState } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";

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
    const [user, setUser] = useState<User | null>(null);
    const [isLogin, setIsLogin] = useState<boolean>(false);

    function login( userData: User) {
        setUser(userData);
        setIsLogin(true);
    }

    function logout() {
        setIsLogin(false);
    }

    const value = { user, isLogin, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}