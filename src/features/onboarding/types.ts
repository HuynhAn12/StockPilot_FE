export interface RegisterOwnerPayload {
  account: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    locale?: "vi" | "en";
  };
  store: {
    name: string;
    code: string;
    phone?: string;
    address?: string;
  };
}

export interface SlugCheckResult {
  available: boolean;
  normalizedSlug: string;
  suggestions?: string[];
}
