import ChatRoomService from '../services/ChatRoomService';
import User from "../models/User";
import {Error} from "sequelize";

const chatRoomService = new ChatRoomService();

export const joinWaitList = (userid: string): string => {
    const user = new User(userid, "Jhon")
    try {
        chatRoomService.joinWaitlist(user)
        return (user.username + " join the wait list")
    } catch (error: unknown) {
        return 'An error occurred'
    }
}
