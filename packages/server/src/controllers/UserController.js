import { userService } from '../services/UserService.js'
import jwt from 'jsonwebtoken'

const getUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (err) {
        console.error("Error getting users: ", err);
        res.status(500).send({message: "Error getting users!"});
    }
}

const getUserById = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await userService.getUserById(userId);
        res.status(200).send(user);
    } catch (err) {
        console.error("Error getting user by id: ", err);
        res.status(500).send({message: "Error getting user by id!"});
    }

}

const editUser = async (req, res) => {
    //Por Hacer: El email tendría que ir por otro lado ahora mismo junto con la contraseña.
    const userId = req.user.id;
    const {name, email, password} = req.body;
    console.log(parseInt(userId));
    try{
        const user = await userService.updateUserById(userId, name, email,password);
        console.log(user);
        if(user == null) {
            return res.status(401).send({message: "The User you are trying to Edit is not found"});
        }
        res.status(200).json(user);
    } catch (err) {
        console.error("Error updating user information: ", err);
        res.status(500).send({message: "Error updating user information"});
    }
}

const registerUser = async (req, res) => {
    const data = req.body;
    try {
        const exists = await userService.checkIfUserExists(data.name, data.email);
        if (exists) {
            return res.status(409).send({message: "This user is already registered!"});
        }
        const user = userService.createUser(data);
        const token = jwt.sign({ id: (await user).idUser, name: user.name }, process.env.JWT_SECRET)
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
        const user = await userService.getUserByEmail(email, password)
        if(user == null) {
            return res.status(401).send({message: "This email is not registered or the password is incorrect!"});
        }
        const token = jwt.sign({ id: user.idUser, name: user.name }, process.env.JWT_SECRET)
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

const searchUsers = async (req, res) => {
    const userId = req.user.id;
    const query = req.query.q;
    try {
        const users = await userService.getUsersbyName(query, userId);
        if(users == null || users.length === 0) {
            return res.status(404).send({message: "No users found with that name!"});
        }
        res.status(200).json(users);
    } catch (err) {
        console.error("Error searching for users by name:", err);
        res.status(500).send({message: "Error searching for users by name"});
    }
}

export const userController = {
    getUsers,
    registerUser,
    loginUser,
    getUserById,
    editUser,
    searchUsers
};
