import { friendshipService } from '../services/FriendshipService.js';

const addFriend = async (req, res) => {
    const senderId = req.user.id;
    const senderName = req.user.name;   
    const { receiverId } = req.body;

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');

    try {
        const friendship = await friendshipService.createFriendship(senderId, receiverId);
        if (friendship == null) {
            return res.status(400).send({message: "Error sending friendship request!"});
        }
        const socketId = userSockets.get(parseInt(receiverId));
        if (socketId) {
            io.to(socketId).emit('friendRequest', {
                friendship: friendship.idFriendship,
                senderId: senderId,
                senderName: senderName
            });
        }
        res.status(200).json(friendship); 
    } catch (err) {
        console.error("Error sending friendship request: ", err);
        res.status(500).send({message: "Error sending friendship request"});
    }
}


const removeFriend = async (req, res) => {
    const senderId = req.user.id;
    const { receiverId } = req.body;
    try {
        const result = await friendshipService.deleteFriendship(senderId, receiverId);
        if (result == null) {
            return res.status(400).send({message: "Error removing friend!"});
        }
        res.status(200).json(result);
    } catch (err) {
        console.error("Error removing friend: ", err);
        res.status(500).send({message: "Error removing friend"});
    }
}

const listFriends = async (req, res) => {
    const userId = req.user.id;
    try {
        const friends = await friendshipService.getAllFriendsById(userId);
        res.status(200).json(friends);
    } catch (err) {
        console.error("Error listing friends: ", err);
        res.status(500).send({message: "Error listing friends"});
    }
}

const listPendingFriendshipRequests = async (req, res) => {
    const userId = req.user.id;
    try {
        const friendshipRequests = await friendshipService.getAllPendigFriendship(userId);
        res.status(200).json(friendshipRequests);
    } catch (err) {
        console.error("Error listing pending friendship requests: ", err);
        res.status(500).send({message: "Error listing pending friendship requests"});
    }
}

const changeFriendshipStatus = async (req, res) => {
    const { friendshipId, action } = req.body;
    try {
        const friendship = await friendshipService.updateFriendshipStatus(friendshipId, action);
        console.log(friendship);
        res.status(200).json(friendship);
    } catch (err) {
        console.error("Error updating friendship status", err);
        res.status(500).send({message: "Error"})
    }
}

export const friendshipController = {
    addFriend,
    removeFriend,
    listFriends,
    listPendingFriendshipRequests,
    changeFriendshipStatus
};