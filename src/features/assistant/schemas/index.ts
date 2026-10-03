import { z } from "zod";

export const askAssistantSchema = z.object({
  prompt: z.string().min(1, "Nội dung câu hỏi không được trống"),
  stockItemId: z.number().optional(),
});

export type AskAssistantInput = z.infer<typeof askAssistantSchema>;
