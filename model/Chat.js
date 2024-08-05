import mongoose from 'mongoose';


const chatSchema = new mongoose.Schema({
    url : {
        type: String,
        require: true
    },
    chat : [
        {
            user_chat: {
                type: String,
                require: true
            },
            ai_chat: {
                type: String,
                require: true
            },
        }
    ]
})

const Chat = new mongoose.model("Chat", chatSchema)

export default Chat