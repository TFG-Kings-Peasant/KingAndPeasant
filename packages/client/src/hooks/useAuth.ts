import { useEffect } from "react";
import { useUser } from "./useUser";
import { useLocalStorage } from "./useLocalStorage";
import type { User } from "../context/AuthContext.ts";
import { io } from "socket.io-client"

export const useAuth = () => {
    const  { user, isLogin, login, logout } = useUser();
    const { getItem } = useLocalStorage();

    const socket = io();

    useEffect(() => {
        const userJson = getItem("user");
        if (userJson) {
            const user: User | null = userJson ? (JSON.parse(userJson) as User): null;
            if (user != null) {
                login(user);
            }
        }
    }, [getItem, login]);

    return { user, isLogin, login, logout, socket }; 
}