
import natural from 'natural';

import path from 'path';
import fs from 'fs'
import pkg from 'faiss-node';
const { IndexFlatL2 } = pkg;
import { CohereClient } from 'cohere-ai';
import { sanitizeFileName } from './url_handler.js';

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
});




export async function divideInChunks(transcript) {
    const windowSize = 90;
    const stepSize = 50;
    const tokenizer = new natural.WordTokenizer();
    const words = tokenizer.tokenize(transcript);

    const chunks = [];
    const numWords = words.length;

    for (let i = 0; i < numWords; i += stepSize) {
        // Create a chunk with a sliding window
        const chunk = words.slice(i, i + windowSize).join(' ');
        chunks.push(chunk);

        // Break the loop if the end of the transcript is reached
        if (i + windowSize >= numWords) {
            break;
        }
    }
    return chunks;
}


export async function generateEmbeddings(transcript) {
    const embed = await cohere.embed({
        texts: transcript,
        model: 'embed-english-v3.0',
        inputType: 'classification',
    });
    console.log("cohere")
    return embed
};



export async function saveEmbeddingInVectorDb(embeddingsResult, url) {
    const urlObject = new URL(url);
    const folderName = urlObject.searchParams.get("v");
    const embeddings = embeddingsResult.map(item => item.embeddings[0]);
    const metadata = embeddingsResult.map(({ embeddings, ...rest }) => rest);

    const dimension = embeddings[0].length;
    const index = new IndexFlatL2(dimension);

    console.log("Creating FAISS index...");
    embeddings.forEach(embeddings => {
        index.add(embeddings);
    });

    const currentDirectory = process.cwd();
    const dataFolder = path.join(currentDirectory, '.', 'data');
    const newFolderPath = path.join(dataFolder, folderName);

    try {
        // Create the data folder and the specific folder
        fs.mkdir(newFolderPath, { recursive: true }, (err) => {
            if (err) throw err;
        });
        console.log(`Folder created successfully at ${newFolderPath}`);

        const indexFilePath = path.join(newFolderPath, 'faiss.index');
        const metadataFilePath = path.join(newFolderPath, 'metadata.json');

        // Write the index
        index.write(indexFilePath);
        console.log(`Index saved to ${indexFilePath}`);

        // Write the metadata to a JSON file
        fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2), (err) => {
            if (err) throw err;
        });
        console.log(`Metadata saved to ${metadataFilePath}`);

        return indexFilePath;
    } catch (err) {
        console.error(`Error: ${err.message}`);
        throw err;
    }
}


export async function searchVectorDb(questionEmbedding, url, k = 5) {
    try {
        const currentDirectory = process.cwd();
        const dataFolder = path.join(currentDirectory, '.', 'data');

        // Create a valid folder name from the URL
        const urlObject = new URL(url);
        const folderName = urlObject.searchParams.get("v");

        const folderPath = path.join(dataFolder, folderName);

        // Read the FAISS index
        const indexFilePath = path.join(folderPath, 'faiss.index');
        const index = IndexFlatL2.read(indexFilePath);

        // Perform the search
        const { distances, labels } = index.search(questionEmbedding.embeddings[0], k);

        console.log(distances, labels)

        // Read and parse the metadata
        const metadataFilePath = path.join(folderPath, 'metadata.json');
        console.log("metadata file path", metadataFilePath)

        const metadataRaw = await fs.promises.readFile(metadataFilePath, 'utf-8');
        console.log("metadata raw", metadataRaw);
        const metadata = JSON.parse(metadataRaw);

        // Map the results to text
        const results = labels.map((label, i) => {
            const metadataItem = metadata[label];
            return {
                text: metadataItem.texts[0] || 'No text available',
                distance: distances[0][i]
            };
        });

        return results;
    } catch (err) {
        console.error(`Error in searchVectorDb: ${err.message}`);
        throw err;
    }
}