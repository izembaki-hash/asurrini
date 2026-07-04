'use server';

/**
 * @fileOverview An AI agent that recommends travel insurance plans based on user trip details and risk factors.
 *
 * - recommendInsurancePlan - A function that recommends an insurance plan.
 * - RecommendInsurancePlanInput - The input type for the recommendInsurancePlan function.
 * - RecommendInsurancePlanOutput - The return type for the recommendInsurancePlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
      model: 'llama-3.3-70b-versatile',
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

const prompt = ai.definePrompt({
  name: 'recommendInsurancePlanPrompt',
  input: {schema: RecommendInsurancePlanInputSchema},
  output: {schema: RecommendInsurancePlanOutputSchema},
  prompt: `You are an AI travel insurance expert for Algerian residents. Based on the user's trip details and risk factors, recommend the most suitable travel insurance plan.

Trip Details:
- Destination: {{{destination}}}
- Start Date: {{{startDate}}}
- End Date: {{{endDate}}}
- Number of Travelers: {{{travelerCount}}}
- Traveler Age: {{{travelerAge}}}
- Pre-existing Conditions: {{{preExistingConditions}}}
- Trip Purpose: {{{tripPurpose}}}
- Budget: {{{budget}}} DZD. Note: The provided budget will be one of three specific values: 150,000 DZD, 300,000 DZD, or 600,000 DZD.

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

Consider these factors when recommending a plan and determining its price:
* Comprehensive coverage aligned with the destination and trip purpose, including the guarantees listed above.
* Adequate medical coverage for potential health issues, considering pre-existing conditions.
* Trip cancellation and interruption coverage (if applicable to the plan type).
* Baggage loss or delay coverage.

**Budget & Pricing Rules (IMPORTANT):**
- The price you generate for the recommended plan MUST always be much lower than the user's budget.
- The price must vary based on the trip duration (longer trips cost more), the traveler's age (older travelers pay more), and the destination (higher risk or more expensive destinations cost more).
- If the budget is 150,000 DZD, the price should still be less than 3,000 DZD for a short trip, young traveler, and safe destination, but can be higher (up to 2% of the budget) for long trips, older travelers, or high-risk destinations.
- If the budget is 300,000 DZD, the price should be less than 6,000 DZD for the lowest risk, but can be higher for longer trips, older travelers, or high-risk destinations (but always much less than the budget).
- The price for a 150,000 DZD budget must always be less than the price for a 300,000 DZD budget, and so on.
- The price should be as low as possible while still offering essential coverage, and always much cheaper than traditional Algerian insurance providers.
- Give a very competitive price, and do not simply match the budget value.

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

Consider these factors when recommending a plan and determining its price:
* Comprehensive coverage aligned with the destination and trip purpose, including the guarantees listed above.
* Adequate medical coverage for potential health issues, considering pre-existing conditions.
* Trip cancellation and interruption coverage (if applicable to the plan type).
* Baggage loss or delay coverage.

**Budget Consideration:** Your recommended plan should ideally fit within the user's {{{budget}}} DZD. The price you generate for the recommended plan MUST be sensitive to this budget.
*   If the most suitable comprehensive plan slightly exceeds the budget, you may recommend it but clearly state in the rationale that it exceeds the budget and explain why it's a better option than a cheaper, less comprehensive alternative.
*   If the budget is very restrictive, prioritize essential coverage (medical, repatriation) while still aiming for the best possible value within that constraint. Clearly state in the rationale any significant compromises made due to the budget (e.g., lower coverage limits, fewer guarantees).
*   The price itself should reflect the budget constraint as much as realistically possible while maintaining essential coverage.
*   **Important for Modifications:** When this prompt is used for *modifying* an existing contract, the provided 'budget' field reflects the user's original budget (which would have been one of 150,000, 300,000, or 600,000 DZD). The AI's role is to determine the *new total premium* for the *modified trip parameters*. This new total premium must also be competitively priced. If the modified trip (e.g., longer duration, more expensive destination) inherently costs more, you *should* provide a realistic higher price for the new parameters. Clearly state in the rationale if the new price exceeds the original budget due to these changes. The application will handle calculating the actual cost due for the modification (a fixed fee + a pro-rata charge for any additional days). The difference between the old and new total premium of the plan itself is *not* charged as part of the modification cost.

Provide a suitabilityScore (0-100) indicating how well the plan matches the user's needs.
Explain the rationale for your recommendation, including how the budget influenced the choice and price.

Ensure that the plan details, coverage, and policy documents are available in French, as the application caters to Algerian residents.
The 'price' field must be a single numerical value representing the cost in DZD. Do not include the currency symbol or unit (like 'DZD') in the numerical value itself for the 'price' field.

**Pricing Strategy:**
The pricing strategy must be highly competitive to attract customers in the Algerian market. Generate prices that are **competitively priced and noticeably more affordable** than traditional Algerian insurance providers, including Carama. You are expected to simulate prices that represent a **very good value proposition** compared to typical market rates, while reflecting realistic variations based on destination risk, trip duration, traveler age, number of travelers, and budget. The budget itself should significantly influence the final price.

**Destination-Specific Pricing Tiers (Relative Examples for a 15-day trip, young adult, adjust for other factors like budget):**
These are baseline examples if Carama's pricing is a reference. Your prices should be *noticeably lower* than these Carama examples to be highly competitive.

*   **Maghreb Countries (e.g., Tunisia, Morocco):** Most affordable. If Carama charges ~2500 DZD, aim for **1900-2200 DZD**.
*   **Countries with Strong Ties (e.g., Turkey):** Cheaper than Schengen. If Carama charges ~3000 DZD for Turkey, aim for **2300-2650 DZD**.
*   **Schengen Area (e.g., France, Spain, Italy):** Carama typically prices a 15-day trip for a young adult (~25-35 years old) around 3500 DZD. Your price should be significantly lower, e.g., **2700-3100 DZD**.
*   **Americas (North & South), Australia, Japan (Higher Cost Destinations):** For a 15-day trip, Carama might charge ~4450 DZD for a young adult. Your price should be more competitive, e.g., **3600-4050 DZD**.
*   **Other African Countries (non-Maghreb, potentially higher risk/cost):** Pricing should reflect increased risk/cost compared to Maghreb or Schengen but still be very competitive. If Carama prices a trip to a sub-Saharan African country at 4000-5000 DZD, aim for **3300-4200 DZD**.

Use these examples as a baseline and adjust realistically based on the specific trip duration (longer trips cost more), exact destination within a tier, number of travelers, traveler ages (older travelers usually incur higher premiums), the level of coverage, and the user's budget. The goal is to provide a price that feels authentic and reflective of risk, but is significantly more competitive than typical market positioning.

**When adjusting for trip duration based on the 15-day examples:**
The pricing for duration must be highly sensitive. A 90-day trip MUST be significantly more expensive than a 15-day trip. For example, for the Schengen area, if a 15-day trip is around 3000 DZD, a 90-day trip should be approximately 12,500 DZD (around 140 DZD/day for the 90-day trip, implying a per-day rate that is lower for much longer trips but the total is substantially higher).
*   **Crucially, if the trip duration (number of days between start and end date) increases, the total price of the recommended plan *must* increase substantially. If the duration decreases, the total price *should* decrease (respecting minimum premium levels). This is a non-negociable rule for pricing.**
*   For contract modifications involving increased duration, use the daily rate derived from a competitively priced *new* total premium for the *new* duration. For example, if a modified trip becomes 90 days to Schengen, the new total plan premium might be around 12,500 DZD. The daily rate for calculating the pro-rata additional charge would be 12,500 DZD / 90 days = approx 138.89 DZD/day. The modification cost would be a fixed fee (e.g., 290 DZD) + (additional_days * ~138.89 DZD).
*   Price adjustments for duration must be consistent and logical.

If you don't have a specific provider name, generate a plausible one (e.g., "Algerian Travel Secure", "SaharaAssur Voyages", "Atlas Voyage Protect").
For the policyDocumentLink, if a specific document link is not known, use the exact string "MOCK_POLICY_LINK_PLACEHOLDER".`,
  config: {
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
        threshold: 'BLOCK_ONLY_HIGH', // Keep this relatively strict for safety
      },
    ],
  },
});

const recommendInsurancePlanFlow = ai.defineFlow(
  {
    name: 'recommendInsurancePlanFlow',
    inputSchema: RecommendInsurancePlanInputSchema,
    outputSchema: RecommendInsurancePlanOutputSchema,
  },
  async (input): Promise<RecommendInsurancePlanOutput> => {
    const response = await prompt(input);
    const output = response.output;

    if (!output) {
      let debugInfo: any = { input };
      debugInfo.responseRaw = JSON.stringify(response, null, 2)?.substring(0,1000); 
      console.error('AI failed to generate valid structured output for recommendInsurancePlanFlow. Details:', debugInfo );
      let userMessage = "L'IA n'a pas pu générer une recommandation structurée valide. Veuillez essayer de modifier vos critères ou réessayer plus tard.";
      throw new Error(userMessage);
    }
    return output;
  }
);

