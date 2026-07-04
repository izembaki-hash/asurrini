
export const APP_NAME = "ASSURINI";
export const APP_DESCRIPTION = "Votre partenaire d'assurance voyage en Algérie.";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  PROFILE: "/profile",
  GET_QUOTE: "/quote",
  CHECKOUT: "/checkout",
  POLICY_SUCCESS: "/checkout/success",
  MODIFY_CONTRACT: "/modify-contract",
  MODIFY_CONTRACT_SUCCESS: "/modify-contract/success",
};

export const MOCK_INSURANCE_POLICY_LINK = "/documents/mock-policy-fr.pdf"; // This file won't exist, it's a mock link.

export const TRIP_PURPOSES = [
  { value: "loisirs", label: "Loisirs" },
  { value: "affaires", label: "Affaires" },
  { value: "etudes", label: "Études" },
  { value: "visite_familiale", label: "Visite Familiale" },
  { value: "autre", label: "Autre" },
];

export const DEFAULT_CURRENCY = "DZD"; // Currency for budget input, matching GenAI flow
export const MODIFICATION_FEE = 290; // Modification fee in DZD

export const INSURANCE_POLICY_NUMBER_PREFIX = "ASNI"; // Changed prefix for ASSURINI
export const USER_CONTRACTS_STORAGE_KEY = "assuriniUserContracts"; // Changed storage key

