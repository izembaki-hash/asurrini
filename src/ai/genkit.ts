import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Temporarily use Google AI - we'll replace the implementation in the flow
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY || 'dummy-key',
    })
  ],
  model: 'googleai/gemini-2.0-flash',
});
