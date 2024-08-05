import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import fs from 'fs';


import { AssemblyAI } from 'assemblyai';

// Initialize AssemblyAI client
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_API_KEY
});


// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloaded_audio_folder = path.join(__dirname, '..', 'downloaded_audio');

export function sanitizeFileName(fileName) {
    // Replace or remove invalid characters in the file name
    return fileName.replace(/[\\/:*?"<>|]/g, '').replace(/ /g, '_');
}

export async function urlToAudioConvertor(url) {
    return new Promise(async (resolve, reject) => {
        console.log("1")
        console.log(url)
        const urlObject = new URL(url);
        console.log("2")
        const videoId = urlObject.searchParams.get("v")
        console.log("3")
        console.log(videoId);
        console.log("4")
    
        const options = {
            method: 'GET',
            url: 'https://youtube-mp36.p.rapidapi.com/dl',
            params: { id: videoId },
            headers: {
            'X-RapidAPI-Key': 'f0f2be9902msh02df0568550c5bbp13cacdjsn61cf4c71eaf9',
            'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
            }
        };
    
        try {
            console.log("5");
            const response = await axios.request(options);
        //  console.log(response)
            const downloadLink = response.data.link;
            console.log('234234',downloadLink)
    
            const audioFileResponse = await axios.get(downloadLink, { responseType: 'stream' });
    
            let audioFileName = 'audio.mp3';
            if (audioFileResponse.headers['content-disposition']) {
            console.log("6");
            audioFileName = audioFileResponse.headers['content-disposition'].split('=')[1];
            }
    
            console.log("7");
    
            const sanitizedFileName = sanitizeFileName(audioFileName);
            console.log("8");
    

            const filePath = path.join(downloaded_audio_folder, sanitizedFileName);
            const writer = fs.createWriteStream(filePath);
            console.log("9");
    
            audioFileResponse.data.pipe(writer);
            console.log("10");
    
            writer.on('finish', () => {
            console.log("11");
            console.log(`Audio file ${sanitizedFileName} saved successfully.`);
            resolve(sanitizedFileName);
            });
    
            writer.on('error', (err) => {
            console.log("12");
            console.error(`Error saving audio file: ${err}`);
            reject(err);
            });
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
}


export async function audioToTranscript(audioFileName) {
    const audioUrlPath = path.join(downloaded_audio_folder, audioFileName)
    const params = {
        audio: audioUrlPath,
        speaker_labels: true
      }

    const transcript = await client.transcripts.transcribe(params)

    return transcript.text
}