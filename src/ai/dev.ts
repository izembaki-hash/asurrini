import { config } from 'dotenv';
config();

import '@/ai/flows/recommend-insurance-plan.ts';
import '@/ai/flows/chatbot-flow.ts'; // Ajout du nouveau flux chatbot
