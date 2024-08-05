import express from "express";
import Chat from '../model/Chat.js';
import { handle_message } from "../processor/chat_processor.js";

const routes = express.Router();

routes.post('/chat', async (req, res) => {
    const {url, question} = req.body
    try {
        console.log(url, question)
        
        const result = await handle_message(url, question);
        const newDoc = {
            url : url,
            chat : [
                {
                    user_chat : question,
                    ai_chat : result
                }
            ]
        }

        await Chat.create(newDoc)

        res.status(200).json({ message: "ans : ", result });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: "Internal server error" });
    }
});


export default routes; 