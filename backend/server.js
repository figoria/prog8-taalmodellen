import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import express from "express";
import bodyParser from "body-parser";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RetrievalQAChain } from "langchain/chains";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

// Initialize chat model with Azure
const model = new ChatOpenAI({
    temperature: 0.5,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
    azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.ENGINE_NAME,
});

// Initialize embedding for vector
const embeddings = new OpenAIEmbeddings({
    temperature: 0.1,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
    azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.DEPLOYMENT_NAME,
});

const app = express();
app.use(bodyParser.json());

// Middleware for CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Accept, Content-Type, Origin');
    next();
});

const port = 3000;
let messages = [];
let prompt;
const directory = "vectordatabase";

// Load Faiss vector store
let vectorStore;
(async () => {
    vectorStore = await FaissStore.load(directory, embeddings);
})();

// This function sends a query to GPT using the loaded Faiss vector store
app.post('/chat', async (req, res) => {
    try {
        prompt = req.body.question;
        messages.push(['you:', prompt]);

        // Create a RetrievalQAChain using the vector store
        const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

        // Run the query
        const response = await chain.invoke({ query: prompt });

        // Respond with the result
        res.json({ answer: response.text });
        messages.push(['AI:', `${response.text}`]);
        console.log(messages);
    } catch (error) {
        console.error("Error handling chat query:", error);
        res.status(500).json({ error: "An error occurred while processing your request." });
    }
});

app.get('/reset', (req, res) => {
    messages.splice(0, messages.length);
    res.sendStatus(200);
});

// This function starts the server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});