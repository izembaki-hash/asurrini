"use server";

import { recommendInsurancePlan } from "@/ai/flows/recommend-insurance-plan";
import type { RecommendInsurancePlanInput, RecommendInsurancePlanOutput } from "@/ai/flows/recommend-insurance-plan";
import { MOCK_INSURANCE_POLICY_LINK } from "@/lib/constants";

export async function getInsuranceRecommendationAction(
  input: RecommendInsurancePlanInput
): Promise<RecommendInsurancePlanOutput | { error: string; details?: string }> {
  try {
    // Basic validation (more robust validation could be added here or via Zod in the flow itself)
    if (!input.destination || !input.startDate || !input.endDate || input.travelerCount <= 0 || input.travelerAge <= 0 || input.budget < 0) {
      return { error: "Veuillez remplir tous les champs obligatoires avec des valeurs valides." };
    }
    
    const result = await recommendInsurancePlan(input);
    
    // This check might seem redundant if recommendInsurancePlan always throws on failure.
    // However, it's a safeguard in case the flow somehow resolves to a falsy value without throwing.
    // With the improved flow, this path should be less likely for missing AI output.
    if (!result) {
        console.error("getInsuranceRecommendationAction: recommendInsurancePlan returned a falsy value without throwing an error.", {input});
        return { error: "Aucune recommandation n'a pu être générée. Veuillez réessayer. (Code: AI_UNEXPECTED_NO_RESULT)" };
    }

    // Handle placeholder for policy document link
    if (result.policyDocumentLink === "MOCK_POLICY_LINK_PLACEHOLDER") {
      result.policyDocumentLink = MOCK_INSURANCE_POLICY_LINK;
    }

    return result;
  } catch (error: any) {
    console.error("Error in getInsuranceRecommendationAction:", error);
    
    let userErrorMessage = "Une erreur technique est survenue lors de la récupération de la recommandation. Veuillez réessayer plus tard.";
    let errorDetailsForDev = "Détail technique: ";

    if (error instanceof Error) { // More type-safe error handling
      errorDetailsForDev += `${error.name}: ${error.message}`;
      if (error.stack && process.env.NODE_ENV === 'development') {
        errorDetailsForDev += `\nStack: ${error.stack}`;
      }
      
      // Check for specific error messages thrown from our AI flow
      if (error.message.startsWith("L'IA n'a pas pu générer une recommandation structurée valide.")) {
        userErrorMessage = error.message; // Use the specific, more user-friendly message from the flow
      }
      // Example: Add checks for specific Genkit/GoogleAI errors if needed
      // else if (error.name === 'GoogleGenerativeAIError' && error.message.includes('SAFETY')) {
      //   userErrorMessage = "La recommandation n'a pas pu être générée en raison de restrictions de contenu.";
      // }
      
    } else {
      // Handle non-Error objects thrown
      const errorString = String(error);
      errorDetailsForDev += errorString;
      if (typeof error === 'object' && error !== null && process.env.NODE_ENV === 'development') {
        try {
          errorDetailsForDev += `\nFull Error Object (JSON): ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`;
        } catch (e) {
          errorDetailsForDev += `\nFull Error Object (String): ${String(error)}`;
        }
      }
    }
    
    // Only include detailed technical info in development
    // The 'details' field is primarily for debugging or more specific UI error states if designed.
    const details = process.env.NODE_ENV === 'development' ? errorDetailsForDev : undefined;
    return { error: userErrorMessage, details };
  }
}
