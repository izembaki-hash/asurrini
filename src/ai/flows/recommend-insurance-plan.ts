'use server';

/**
 * @fileOverview An AI agent that recommends travel insurance plans based on user trip details and risk factors.
 *
 * - recommendInsurancePlan - A function that recommends an insurance plan.
 * - RecommendInsurancePlanInput - The input type for the recommendInsurancePlan function.
 * - RecommendInsurancePlanOutput - The return type for the recommendInsurancePlan function.
 */

import {z} from 'zod';

const RecommendInsurancePlanInputSchema = z.object({
  destination: z.string().describe('The trip destination.'),
  startDate: z.string().describe('The trip start date (YYYY-MM-DD).'),
  endDate: z.string().describe('The trip end date (YYYY-MM-DD).'),
  travelerCount: z.number().describe('The number of travelers.'),
  travelerAge: z.number().describe('The age of the primary traveler.'),
  preExistingConditions: z.string().describe('Any pre-existing medical conditions of the travelers.'),
  tripPurpose: z.string().describe('The purpose of the trip (e.g., leisure, business).'),
  budget: z.number().describe('The budget for the insurance plan in DZD. This will be one of 150000, 300000, or 600000 DZD.'),
});

export type RecommendInsurancePlanInput = z.infer<typeof RecommendInsurancePlanInputSchema>;

const RecommendInsurancePlanOutputSchema = z.object({
  planName: z.string().describe('The name of the recommended insurance plan.'),
  provider: z.string().describe('The insurance provider.'),
  coverageDetails: z.string().describe('A detailed description of the plan coverage, including key guarantees like medical expenses, repatriation, dental care, baggage, etc. List each guarantee on a new line.'),
  price: z.number().describe('The price of the insurance plan in DZD.'),
  policyDocumentLink: z.string().describe('A link to the policy document.'),
  suitabilityScore: z
    .number()
    .describe(
      'A score (0-100) indicating how well the plan matches the user needs, based on their trip details and risk factors.'
    ),
  rationale: z.string().describe('Explanation of why the plan is recommended.'),
});

export type RecommendInsurancePlanOutput = z.infer<typeof RecommendInsurancePlanOutputSchema>;

function buildPromptText(input: RecommendInsurancePlanInput): string {
  return `You are an AI travel insurance expert for Algerian residents. Based on the user's trip details and risk factors, recommend the most suitable travel insurance plan.

Trip Details:
- Destination: ${input.destination}
- Start Date: ${input.startDate}
- End Date: ${input.endDate}
- Number of Travelers: ${input.travelerCount}
- Traveler Age: ${input.travelerAge}
- Pre-existing Conditions: ${input.preExistingConditions}
- Trip Purpose: ${input.tripPurpose}
- Budget: ${input.budget} DZD

Your recommended plan should offer comprehensive coverage. For the 'coverageDetails' field, provide a multi-line string detailing key guarantees, similar to what a traditional insurer like Carama might offer. Examples of guarantees to consider including:
- Frais médicaux et hospitalisation à l'étranger (avec un plafond, ex: jusqu'à 30,000 EUR ou 50,000 EUR)
- Rapatriement médical ou en cas de décès (couverture des frais réels)
- Soins dentaires d'urgence (avec un plafond, ex: jusqu'à 300 EUR)
- Prolongation de séjour si médicalement nécessaire (avec plafond journalier et durée max)
- Transport ou visite d'un proche en cas d'hospitalisation
- Perte, vol ou détérioration de bagages (avec un plafond)
- Assistance juridique à l'étranger (avec un plafond)
- Frais de recherche et de sauvetage
- Responsabilité civile à l'étranger

Provide a suitabilityScore (0-100) indicating how well the plan matches the user's needs.
Explain the rationale for your recommendation.

If you don't have a specific provider name, generate a plausible one (e.g., "Algerian Travel Secure", "SaharaAssur Voyages", "Atlas Voyage Protect").
For the policyDocumentLink, use the exact string "MOCK_POLICY_LINK_PLACEHOLDER".

IMPORTANT: Respond ONLY with a valid JSON object matching this exact structure:
{
  "planName": "string",
  "provider": "string",
  "coverageDetails": "string with newlines for each guarantee",
  "price": number (will be overridden by calculated price),
  "policyDocumentLink": "MOCK_POLICY_LINK_PLACEHOLDER",
  "suitabilityScore": number (0-100),
  "rationale": "string"
}`;
}

function calculateInsurancePrice({ startDate, endDate, travelerAge, destination }: { startDate: string, endDate: string, travelerAge: number, destination: string }) {
  // Calcul du nombre de jours
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  // Base par jour
  let basePerDay = 80; // DZD

  // Coefficient destination
  let destCoef = 1;
  if (/france|italy|spain|schengen/i.test(destination)) destCoef = 1.5;
  else if (/turkey|tunisia|morocco|maghreb/i.test(destination)) destCoef = 1.1;
  else if (/usa|canada|japan|australia|america/i.test(destination)) destCoef = 1.7;
  else if (/africa|nigeria|ghana|kenya/i.test(destination)) destCoef = 1.3;

  // Coefficient âge
  let ageCoef = 1;
  if (travelerAge >= 60) ageCoef = 1.5;
  else if (travelerAge >= 40) ageCoef = 1.2;
  else if (travelerAge <= 18) ageCoef = 0.9;

  // Calcul final
  let price = Math.round(basePerDay * days * destCoef * ageCoef);
  // Plafond minimum et maximum
  price = Math.max(800, price); // minimum 800 DZD
  price = Math.min(price, 0.02 * 600000); // maximum 2% du budget max
  return price;
}

export async function recommendInsurancePlan(
  input: RecommendInsurancePlanInput
): Promise<RecommendInsurancePlanOutput> {
  // Calcul du prix automatique
  const autoPrice = calculateInsurancePrice({
    startDate: input.startDate,
    endDate: input.endDate,
    travelerAge: input.travelerAge,
    destination: input.destination,
  });

  // Use Groq API directly
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'user',
          content: buildPromptText(input) + '\n\nIMPORTANT: Respond ONLY with the JSON object, no markdown formatting, no explanations.',
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error:', response.status, response.statusText);
    console.error('Error details:', errorText);

    // Handle specific error cases
    if (response.status === 429) {
      throw new Error("Limite de requêtes atteinte. Veuillez attendre quelques secondes et réessayer.");
    } else if (response.status === 401) {
      throw new Error("Erreur d'authentification API. Veuillez vérifier la configuration.");
    }

    throw new Error(`Erreur API (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("L'IA n'a pas pu générer une recommandation. Veuillez réessayer.");
  }

  let aiResult: RecommendInsurancePlanOutput;
  try {
    // Remove markdown code blocks (```json or ``` or ```)
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Remove any text before the first { and after the last }
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      content = content.substring(firstBrace, lastBrace + 1);
    }

    // Clean up escaped newlines and extra whitespace
    content = content.trim();

    aiResult = JSON.parse(content);

    // Validate required fields
    if (!aiResult.planName || !aiResult.provider || !aiResult.coverageDetails) {
      throw new Error('Missing required fields in AI response');
    }
  } catch (e) {
    console.error('Failed to parse AI response:', content);
    console.error('Parse error:', e);
    throw new Error("L'IA n'a pas pu générer une recommandation structurée valide.");
  }

  // On remplace le prix IA par le prix calculé côté code
  return { ...aiResult, price: autoPrice };
}

