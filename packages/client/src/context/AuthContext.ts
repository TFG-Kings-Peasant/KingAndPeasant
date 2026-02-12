import { createContext } from "react";

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

