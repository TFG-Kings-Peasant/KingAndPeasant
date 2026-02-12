import { friendshipService } from '../services/FriendshipService.js';

const addFriend = async (req, res) => {
    const senderId = req.user.id;
    const { receiverId } = req.body;
    try {
        const friendship = await friendshipService.createFriendship(senderId, receiverId);
        if (friendship == null) {
            return res.status(400).send({message: "Error sending friendship request!"});
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

export const friendshipController = {
    addFriend,
    removeFriend,
    listFriends
};