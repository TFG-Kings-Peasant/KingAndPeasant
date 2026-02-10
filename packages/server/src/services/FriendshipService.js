import { prisma } from '../../config/db.js';
import { getUserById } from './UserService.js';

const createFriendship = async (senderId, receiverId) => {
    const sender = await getUserById(senderId);
    const receiver = await getUserById(receiverId);
    
    if (!sender || !receiver) {
        console.error("Error: Invalid sender or receiver ID in createFriendship:", senderId, receiverId);
        return null; 
    }

    const friendship = await prisma.friendship.create({
        data: {
            senderId: senderId, 
            sender: sender,
            receiverId: receiverId,
            receiver: receiver
        }
    })
    return friendship;
};

const deleteFriendship = async (sennderId, receiverId) => {
    const friendship = await prisma.friendship.delete({
        where: {
            idSender_idReceiver: {
                senderId: sennderId,
                receiverId: receiverId
            }
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
    getAllFriendsById
}