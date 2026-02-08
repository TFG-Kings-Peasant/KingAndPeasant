import { useEffect } from "react";
import { useUser } from "./useUser";
import { useLocalStorage } from "./useLocalStorage";
import type { User } from "../context/AuthContext";

export const useAuth = () => {
    const  { user, addUser, removeUser, isLogin, login, logout } = useUser();
    const { getItem } = useLocalStorage();

    useEffect(() => {
        const userJson = getItem("user");
        if (userJson) {
            let user: User | null = userJson ? (JSON.parse(userJson) as User): null;
            if (user != null) {
                addUser(user);
            }
        }
    }, [addUser, getItem]);

    return { user, isLogin, login, logout }; 
}