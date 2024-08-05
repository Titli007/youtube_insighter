
import { divideInChunks, generateEmbeddings, saveEmbeddingInVectorDb, searchVectorDb } from "./embeder.js";
import { aiResponse } from "./llm_caller.js";
import { audioToTranscript, urlToAudioConvertor } from "./url_handler.js";
import Chat from "../model/Chat.js";

export async function handle_message(url, question) {
    let urlRes = await Chat.findOne({url: url}) 
    console.log("urlres", urlRes)
    if(!urlRes) {
        const audioFileName = await urlToAudioConvertor(url)
        const trasnscript = await audioToTranscript(audioFileName)

        const chunks = await divideInChunks(trasnscript)

        let allEmbedding = []

        console.log(chunks)

        for(const chunk of chunks) {
            const embed = await generateEmbeddings([chunk])
            allEmbedding.push(embed)
        }

        console.log("all embeding", allEmbedding)

        await saveEmbeddingInVectorDb(allEmbedding, url)
    }  

    const questionEmbedding = await generateEmbeddings([question])

    const docs = await searchVectorDb(questionEmbedding, url)


    const result = await aiResponse(docs, question)
    return result
}