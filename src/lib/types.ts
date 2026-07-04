
import type { RecommendInsurancePlanOutput } from "@/ai/flows/recommend-insurance-plan";

export interface MockUser {
  email: string;
  fullName?: string;
  passportNumber?: string;
  phoneNumber?: string;
  address?: string;
}

// InsurancePlan is the direct output from the AI
export type InsurancePlan = RecommendInsurancePlanOutput;

// This structure will be stored in localStorage on initial quote page and used for checkout
export interface SelectedPlanWithTripDetails {
  plan: InsurancePlan; // The AI recommended plan
  userInput: { // Store all relevant inputs for re-quoting and contract generation
    destination: string;
    startDate: string; // Formatted as "YYYY-MM-DD"
    endDate: string;   // Formatted as "YYYY-MM-DD"
    travelerCount: number;
    travelerAge: number;
    preExistingConditions: string;
    tripPurpose: string;
    budget: number; 
  };
}

export interface TripDetailsFormData {
  destination: string;
  startDate: Date;
  endDate: Date;
  travelerCount: number;
  travelerAge: number;
  preExistingConditions: string;
  tripPurpose: string;
  budget: number; // In DZD as per GenAI flow
}

// Used for generating PDF and for passing details to success pages
export interface ContractPlanDetails {
  policyNumber: string; 
  planName: string;
  provider?: string;
  price: string; // Represents the current total premium of the plan for the PDF
  currency: string;
  startDate?: string | null; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  destination?: string | null;
  policyDocumentLink?: string | null;
  userFullName?: string; 
  userEmail?: string; 
  userPassportNumber?: string; 
  issueDate?: string; // YYYY-MM-DD
  lastModifiedDate?: string; // Full ISO string "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", if applicable
  actualModificationCostPaid?: string; // The fee paid for the last modification
  coverageDetails?: string; // For PDF
}

// Stored in localStorage, represents a persisted user contract
export interface UserContract {
  policyNumber: string;
  planName: string;
  provider?: string;
  originalPrice: string; // Current premium of the plan, updated after each modification
  currency: string;
  startDate: string; // YYYY-MM-DD, modifiable
  endDate: string; // YYYY-MM-DD, modifiable
  destination: string; // Modifiable
  policyDocumentLink?: string | null;
  coverageDetails?: string; // Details of the coverage

  // User identification and initial criteria (used for re-quoting)
  userEmail: string; 
  userFullName: string; 
  userPassportNumber?: string; 
  issueDate: string; // YYYY-MM-DD, original issue date
  lastModifiedDate?: string; // Full ISO string "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", date of last modification

  // Original trip criteria for re-quoting if not part of user profile
  travelerCount: number;
  travelerAge: number;
  preExistingConditions: string;
  tripPurpose: string;
  originalBudget: number; // Budget used for initial/previous successful quote
}

// Fields that can be modified in an existing contract by the user
export interface ModifiableContractFields {
  startDate: Date;
  endDate: Date;
  destination: string;
}

