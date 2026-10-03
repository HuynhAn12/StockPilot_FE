export interface OrderItem {
  id: number;
  stockItemId: number;
  skuSnapshot: string;
  nameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELED";
  customerName?: string | null;
  customerPhone?: string | null;
  totalAmount: number;
  createdAt: string;
  items?: OrderItem[];
}
