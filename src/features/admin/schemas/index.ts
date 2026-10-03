import { z } from "zod";

export const updateUserRoleSchema = z.object({
  userId: z.number(),
  role: z.enum(["SHOP_OWNER", "WAREHOUSE_STAFF", "ADMIN"]),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
