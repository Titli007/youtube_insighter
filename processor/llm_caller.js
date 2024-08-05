require('dotenv').config();

import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable (see "Set up your API key" above)

const API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});





export async function aiResponse(docs, question) {
  try{
    console.log("docs", docs)
    const docString = docs.map(doc => doc.text)
    const prompt = `
        YouTube Video Transcript:
        ${docString.join("\n\n")}

        Based on the above transcript, please answer the following question:
        ${question}

        Instructions:
        1. Carefully analyze the provided transcript.
        2. Focus on information directly relevant to the question.
        3. Provide a concise and accurate answer based solely on the transcript content.
        4. If the transcript doesn't contain enough information to answer the question, state that clearly.

        Answer:`;

    console.log("promopt", prompt)
    
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
    return result.response.text()
  }
  catch(err){
    console.log("Error in aiResponse function:", err)
    return err
  }

}
  


