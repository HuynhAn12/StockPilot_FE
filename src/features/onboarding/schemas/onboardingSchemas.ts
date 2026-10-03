import { z } from "zod";

export const registerOwnerSchema = z.object({
  fullName: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, "Số điện thoại không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  storeName: z.string().min(2, "Tên cửa hàng tối thiểu 2 ký tự"),
  storeCode: z.string().min(3, "Mã slug cửa hàng tối thiểu 3 ký tự"),
  address: z.string().optional(),
});

export type RegisterOwnerInput = z.infer<typeof registerOwnerSchema>;
