import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {useLocalStorage} from "./useLocalStorage";
import type { User } from "../context/AuthContext";

export const useUser = () => {

    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useUser must be used within an AuthProvider");
    }

    const { user, isLogin, login, logout } = context;

    const { setItem } = useLocalStorage();

    const addUser = (newUser: User) => {
        login(newUser);
        setItem("user", JSON.stringify(newUser));
    };

    const removeUser = () => {
        logout();
        setItem("user", "");
    };

    return { user, addUser, removeUser, isLogin, login, logout };
}
