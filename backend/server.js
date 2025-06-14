import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import express from "express";
import bodyParser from "body-parser";
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
let messages = []; // Chat history
let vectorStore;
const directory = "vectordatabase";

// Load Faiss vector store
(async () => {
    vectorStore = await FaissStore.load(directory, embeddings);
})();

// Endpoint to handle chat queries
app.post('/chat', async (req, res) => {
    try {
        const userQuestion = req.body.question;
        messages.push({ role: 'user', content: userQuestion });

        const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
        const retrievedContext = await chain.call({ query: userQuestion });

        const chatHistory = messages
            .map(msg => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`)
            .join('\n');

        const engineeredPrompt = `Je bent een docent op de Hogeschool Rotterdam. Gebruik de volgende context, je moet bij het antwoorden ook aanraden om de cursushandleiding zelf te lezen:\n\nContext: ${retrievedContext.text}\n\nChat History:\n${chatHistory}\n\nQuestion: ${userQuestion}`;
        const response = await model.invoke(engineeredPrompt);

        messages.push({ role: 'AI', content: response.text });

        res.json({ answer: response.text });
    } catch (error) {
        console.error("Error handling chat query:", error);
        res.status(500).json({ error: "An error occurred while processing your request." });
    }
});

// Endpoint to reset the conversation
app.get('/reset', (req, res) => {
    messages = [];
    res.sendStatus(200);
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
