require("dotenv").config();
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-pro",
});

module.exports = { llm };
