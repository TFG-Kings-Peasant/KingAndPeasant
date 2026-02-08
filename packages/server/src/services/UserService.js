import { prisma } from '../../config/db.js';
import bcrypt from 'bcryptjs';

const getAllUsers = async () => {
    return await prisma.user.findMany();
};

const createUser = async (data) => {
    const hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hash
        },
    });
    return user;
};

const checkIfUserExists = async (name, email) => {
    const possibleUser = await prisma.user.findFirst({
        where: { 
            OR: [{
                name: String(name), 
            },
            {
                email: String(email),
            },
        ]}
    });
    if(possibleUser) {
        return true;
    }
    return false;
}

const getUserByEmail  = async (email, password) => {
    const user = await prisma.user.findUnique({
        where: { 
            email: String(email),
        }
    });
    if (!user) {
        return null;
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return null;
    }
    return user;
};

const getUserById = async (id) => {
    
    const idNum = parseInt(id);

    if (isNaN(idNum)) {
        console.error("Error: Invalid Id received in getUserById:", id);
        return null; 
    }

    const user = await prisma.user.findUnique({
        where: {
            idUser: idNum,
        }
    });
    if (!user) {
        return null;
    }
    return user;
}

const updateUserById = async (id, name, email, password) => {
    const idNum = parseInt(id);

    if (isNaN(idNum)) {
        console.error("Error: Invalid Id received in updateUserById:", id);
        return null; 
    }

    const dataToUpdate = {
        name: name,
        email: email
    };

    if (password && password.trim !== "") {
        dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    try {
        const user = await prisma.user.update({
        where: {idUser: idNum},
        data: dataToUpdate,
        });
        return user;
    } catch (err) {
        if (err.code === 'P2025') {
            console.error("Error: User not found for update with id:", id);
            return null; 
        }
        throw err;
    }
}

export const userService = {
    getAllUsers,
    createUser,
    checkIfUserExists,
    getUserByEmail,
    getUserById,
    updateUserById
};