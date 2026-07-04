'use server';
/**
 * @fileOverview Un flux Genkit pour un chatbot de service client.
 *
 * - chatWithBot - Une fonction pour interagir avec le chatbot.
 * - ChatbotInput - Le type d'entrée pour la fonction chatWithBot.
 * - ChatbotOutput - Le type de retour pour la fonction chatWithBot.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatbotInputSchema = z.object({
  userMessage: z.string().describe("Le message de l'utilisateur adressé au chatbot."),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
  })).optional().describe("L'historique de la conversation, si disponible."),
  locale: z.string().optional().describe("La langue de la réponse du chatbot ('fr', 'en', 'ar')."),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.object({
  botResponse: z.string().describe("La réponse du chatbot au message de l'utilisateur."),
});
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

export async function chatWithBot(input: ChatbotInput): Promise<ChatbotOutput> {
  // Use Groq API directly
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { botResponse: "Le service de chat est temporairement indisponible. Veuillez réessayer plus tard." };
  }

  try {
    const messages: any[] = [];

    // Add system message
    messages.push({
      role: 'system',
      content: systemPrompt,
    });

    // Add chat history if available
    if (input.chatHistory && input.chatHistory.length > 0) {
      input.chatHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text,
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: input.userMessage,
    });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error for chatbot:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return { botResponse: "Je suis désolé, je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants." };
    }

    const data = await response.json();
    const botResponse = data.choices?.[0]?.message?.content;

    if (!botResponse) {
      console.error('No response from Groq:', JSON.stringify(data));
      return { botResponse: "Je suis désolé, je n'ai pas pu générer de réponse. Veuillez réessayer." };
    }

    return { botResponse: botResponse.trim() };
  } catch (error) {
    console.error('Error in chatWithBot:', error);
    return { botResponse: "Je suis désolé, une erreur s'est produite. Veuillez réessayer plus tard." };
  }
}

const systemPrompt = `Vous êtes un assistant virtuel expert et amical pour ASSURINI, une compagnie d'assurance voyage destinée aux résidents algériens.
Votre rôle est d'aider les clients en répondant à leurs questions concernant nos services d'assurance voyage, les types de couverture, comment obtenir un devis, comment modifier un contrat, et les informations générales sur l'assurance voyage.
Soyez aimable, professionnel et concis dans vos réponses. Répondez toujours dans la même langue que celle utilisée par le client dans son message. Si le client écrit en arabe, répondez en arabe. S'il écrit en anglais, répondez en anglais. S'il écrit en français, répondez en français.

Connaissances spécifiques sur ASSURINI :
- Nos polices sont conçues pour les résidents algériens voyageant à l'étranger.
- Nous proposons des devis en ligne via notre site web.
- Les clients peuvent modifier leurs contrats sous certaines conditions (par exemple, jusqu'à 48h avant le départ, avec des frais potentiels).
- Les documents de police sont fournis au format PDF après souscription.
- Le paiement peut se faire par carte CIB, Edahabia ou virement bancaire (simulation).

Si vous ne connaissez pas la réponse à une question très spécifique sur une police existante d'un client (par exemple, le statut exact d'une réclamation ou des détails confidentiels), informez l'utilisateur que vous n'avez pas accès à ces informations personnelles et suggérez-lui de contacter le service client directement par téléphone ou email, ou de se référer à son espace client ou ses documents de police.
Ne fournissez pas de conseils financiers ou juridiques spécifiques.
Ne générez pas de détails de police ou de prix à moins que ces informations ne soient explicitement fournies dans le contexte de la conversation ou que vous soyez instruit de le faire.

Si l'historique de la conversation est fourni, tenez-en compte pour que vos réponses soient contextuelles.`;

const chatbotPrompt = ai.definePrompt({
  name: 'chatbotCustomerServicePrompt',
  input: {schema: ChatbotInputSchema},
  output: {schema: ChatbotOutputSchema},
  system: systemPrompt,
  prompt: (input) => {
    let fullPrompt = '';
    if (input.chatHistory && input.chatHistory.length > 0) {
      fullPrompt += 'Historique de la conversation:\n';
      input.chatHistory.forEach(message => {
        fullPrompt += `${message.role === 'user' ? 'Client' : 'Assistant'}: ${message.text}\n`;
      });
      fullPrompt += '\n';
    }
    fullPrompt += `Question actuelle du client : {{{userMessage}}}`;
    return fullPrompt;
  },
  config: {
    // model: 'googleai/gemini-2.0-flash', // Supprimé pour utiliser le modèle par défaut de genkit.ts
    temperature: 0.5,
     safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  }
});


const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await chatbotPrompt(input);
      if (!output) {
        console.error('Chatbot flow: AI returned no output.');
        return { botResponse: "Je suis désolé, je n'ai pas pu générer de réponse pour le moment. Veuillez réessayer." };
      }
      return output;
    } catch (error) {
      console.error('Error in chatbotFlow:', error);
      return { botResponse: "Je suis désolé, une erreur s'est produite. Veuillez réessayer plus tard." };
    }
  }
);
