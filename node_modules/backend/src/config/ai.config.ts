import dotenv from 'dotenv';

dotenv.config();

export const aiConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  preferProvider: process.env.GEMINI_API_KEY ? 'gemini' : (process.env.OPENAI_API_KEY ? 'openai' : 'mock'),
};

export default aiConfig;
