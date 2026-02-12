import { prisma } from '../../config/db.js';
import { userService } from './UserService.js';

const createFriendship = async (senderId, receiverId) => {
    const sender = await userService.getUserById(senderId);
    const receiver = await userService.getUserById(receiverId);
    


    if (!sender || !receiver || senderId === receiverId) {
        console.error("Error: Invalid sender or receiver ID in createFriendship:", senderId, receiverId);
        return null; 
    }

    const existingFriendship = await checkIfFriendshipExists(senderId, receiverId);
    if (existingFriendship) {
        console.error("Error: Friendship already exists between sender and receiver in createFriendship:", senderId, receiverId);
        return null; 
    }

    const friendship = await prisma.friendship.create({
        data: {
            idSender: senderId, 
            sender: sender,
            idReceiver: receiverId,
            receiver: receiver
        }
    })
    return friendship;
};

const checkIfFriendshipExists = async (senderId, receiverId) => {
    const friendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                { idSender: senderId, idReceiver: receiverId },
                { idSender: receiverId, idReceiver: senderId }
            ]
        }
    });
    return friendship;
}

const deleteFriendship = async (senderId, receiverId) => {
    const friendship = await prisma.friendship.delete({
        where: {
            OR: [
                { idSender: senderId, idReceiver: receiverId },
                { idSender: receiverId, idReceiver: senderId }
            ]
        }
    })
    return friendship;
}

const getAllFriendsById = async (userId) => {
    const friendships = await prisma.friendship.findMany({
        where: {
            status: 'ACCEPTED',
            OR: [
                { idSender: userId },
                { idReceiver: userId }
            ]
        },
        include: {
            sender: {
                select: { idUser: true, name: true}
            },
            receiver: {
                select: { idUser: true, name: true}
            }
        }
    });

    const friendsList = friendships.map((friendship) => {
        if (friendship.idSender === userId) {
            return friendship.receiver;
        } 
        else {
            return friendship.sender;
        }
    });

    return friendsList;
}

export const friendshipService = {
    createFriendship,
    deleteFriendship,
    getAllFriendsById,
    checkIfFriendshipExists
}