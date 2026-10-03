export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AssistantExplanationResponse {
  sku: string;
  summary: string;
  facts: string[];
  recommendation?: string;
}
