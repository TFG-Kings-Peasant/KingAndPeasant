import { createContext } from "react";
import { Socket } from "socket.io-client"

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
  socket: Socket | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

