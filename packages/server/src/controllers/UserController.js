import { userService } from '../services/UserService.js'
import jwt from 'jsonwebtoken'

const getUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (err) {
        console.error("Error getting users: ", err);
        res.status(500).send({message: "Error getting users"});
    }
}



const registerUser = async (req, res) => {
    const data = req.body;
    try {
        const exists = userService.checkIfUserExists(data.name, data.email);
        if (exists) {
        return res.status(409).send({message: "This user is already registered!"});
        }
        const user = userService.createUser(data);
        const token = jwt.sign({ id: user.userId, name: user.name }, process.env.JWT_SECRET)
        console.log("User Registered: ", user);
        return res.status(200).send({
            message: "Successful Registration!",
            userId: user.idUser,
            name: user.name,
            email: user.email,
            authToken: token
        });
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).send({message: "Error creating user"});
    }
}; 

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = userService.getUserByEmail(email, password)
        if(user == null) {
            return res.status(401).send({message: "This email is not registered or the password is incorrect!"});
        }
        const token = jwt.sign({ id: user.userId, name: user.name }, process.env.JWT_SECRET)
        console.log("User Logged: ", user);
        return res.status(200).send({
            message: "Successful login!",
            userId: user.idUser,
            name: user.name,
            email: user.email,
            authToken: token
        });
    } catch (err) {
        console.error("Error logging in:", err);
        res.status(500).send({message: "Error logging in"});
    }
};

export const userController = {
    getUsers,
    registerUser,
    loginUser
};
