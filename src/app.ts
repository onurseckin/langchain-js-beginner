import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {
  RetrievalQAChain,
  ConversationalRetrievalQAChain,
} from "langchain/chains";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import fs from "fs";

import { marked } from "marked";
import express from "express";
import cors from "cors";
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

// import { OpenAI, PromptTemplate } from "langchain";
// import { StructuredOutputParser } from "langchain/output_parsers";
// import { ChatOpenAI } from "langchain/chat_models";
// import { HumanChatMessage, SystemChatMessage } from "langchain/schema";

//Load environment variables (populate process.env from .env file)
import * as dotenv from "dotenv";
dotenv.config();

//0(deterministic) to 1(creativity) range = temperature
// const chat = new ChatOpenAI({ temperature: 0 });

export const run = async (question) => {
  const readChatHistory = async () => {
    let fileContent;
    try {
      fileContent = await fs.promises.readFile("chat_history.txt", "utf8");
    } catch (err) {
      console.error("Error reading chat history file:", err);
    }
    return fileContent;
  };
  let chatHistory = await readChatHistory();

  const model = new OpenAI({});
  // const loader = new PDFLoader(
  //   "src/document_loaders/CurrentResourceSharingArchitecture.pdf",
  //   {
  //     pdfjs: () =>
  //       import("pdfjs-dist/legacy/build/pdf.js").then((m) => m.default),
  //   }
  // );
  // const loader = new PuppeteerWebBaseLoader("localhost:8090/work/home");
  // const loader = new DirectoryLoader("src/document_loaders/snapfiles", {
  //   ".snap": (path) => new TextLoader(path),
  //   ".txt": (path) => new TextLoader(path),
  // // });
  // const loader = new TextLoader("src/document_loaders/recruitrouter.js.coffee");

  // const rawDocs = await loader.load();
  // console.log("loader created");

  // const textSplitter = new RecursiveCharacterTextSplitter({
  //   chunkSize: 1000,
  //   chunkOverlap: 200,
  // });

  // const docs = await textSplitter.splitDocuments(rawDocs);
  // console.log("Docs splited");

  // console.log("Creating vector store");
  // const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
  // await vectorStore.save("feed/data");

  // to load vector store after saving
  const vectorStore = await HNSWLib.load("feed/data", new OpenAIEmbeddings());

  // Create a chain that uses the OpenAI LLM and HNSWLib vector store.
  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever()
  );
  const response = await chain.call({
    question,
    chat_history: chatHistory,
  });
  chatHistory += question + response.text;

  // const response = await chat.call([
  //   new HumanChatMessage(
  //     "how to test radio on change event in react native using jest and rtl"
  //   ),
  // ]);

  try {
    await fs.promises.writeFile(
      "response.txt",
      JSON.stringify(response, null, 2)
    );
    await fs.promises.writeFile(
      "chat_history.txt",
      JSON.stringify(chatHistory, null, 2)
    );
    console.log("Files saved successfully.");
  } catch (err) {
    console.error("Error writing file:", err);
  }
  const removeEscapedCharacters = (str: string) => {
    return str.replace(/\\n/g, "\n");
  };

  const processFile = async () => {
    let text;
    try {
      // Read the JSON file
      const fileContent = await fs.promises.readFile("response.txt", "utf8");
      // Parse the JSON content
      const jsonData = JSON.parse(fileContent);
      // Extract the 'text' property and remove escaped characters
      text = removeEscapedCharacters(jsonData.text);
      // Convert the text to HTML
      const html = marked.parse(text);
      // Save the result to a new file
      await fs.promises.writeFile("output.md", text);
      await fs.promises.writeFile("html.html", html);
      console.log("File processed successfully.");
    } catch (err) {
      console.error("Error processing file:", err);
    }
    return text;
  };
  return await processFile();
};

const clearFiles = async () => {
  let text = "";
  const fileNames = [
    "response.txt",
    "chat_history.txt",
    "output.md",
    "html.html",
  ];
  try {
    fileNames.forEach(async (fileName) => {
      const fileContent = await fs.promises.writeFile(fileName, text);
    });
    console.log("Files cleared successfully.");
  } catch (err) {
    console.error("Error clearing files:", err);
  }
};

const getHTML = async () => {
  let htmlContent;
  try {
    htmlContent = await fs.promises.readFile("html.html", "utf8");
  } catch (err) {
    console.error("Error reading html file:", err);
  }
  return htmlContent;
};

app.post("/", async (req, res) => {
  const inputString = req.body.question;
  if (!inputString) {
    res.send("No input string provided");
  } else {
    // Process input string here
    res.send(await run(inputString));
  }
});

app.get("/", async (req, res) => {
  try {
    res.send(await getHTML());
  } catch (error) {
    console.error("Error reading html file:", error);
  }
});

app.get("/clear", async (req, res) => {
  try {
    await clearFiles();
    res.send("Files cleared successfully.");
  } catch (error) {
    console.error("Error clearing files:", error);
  }
});

app.listen(3456, () => {
  console.log("Server listening on http://localhost:3456");
});
