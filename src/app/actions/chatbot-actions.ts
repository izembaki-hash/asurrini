'use server';

import { chatWithBot } from '@/ai/flows/chatbot-flow';
import type { ChatbotInput, ChatbotOutput } from '@/ai/flows/chatbot-flow';

export async function sendMessageToChatbotAction(
  input: ChatbotInput
): Promise<ChatbotOutput | { error: string }> {
  try {
    if (!input.userMessage || input.userMessage.trim() === '') {
      return { error: input.locale === 'ar' ? 'لا يمكن أن يكون الرسالة فارغة.' : input.locale === 'en' ? 'Message cannot be empty.' : 'Le message ne peut pas être vide.' };
    }

    const result = await chatWithBot(input);

    if (!result || !result.botResponse) {
      console.error('sendMessageToChatbotAction: chatWithBot returned invalid data.');
      return { error: input.locale === 'ar' ? 'لم أتمكن من إنشاء رد. يرجى المحاولة مرة أخرى.' : input.locale === 'en' ? "I couldn't generate a response. Please try again." : "Je n'ai pas pu générer de réponse. Veuillez réessayer." };
    }
    
    return result;

  } catch (error: any) {
    console.error('Error in sendMessageToChatbotAction:', error);
    return { error: error.message || (input.locale === 'ar' ? 'حدث خطأ أثناء الاتصال بالمساعد.' : input.locale === 'en' ? 'An error occurred while communicating with the chatbot.' : "Une erreur s'est produite lors de la communication avec le chatbot.") };
  }
}
