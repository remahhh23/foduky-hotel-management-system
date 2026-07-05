export type MovementType = "purchase_in" | "return_in" | "adjustment_in" | "sale_out" | "return_out" | "adjustment_out" | "transfer_in" | "transfer_out" | "damage";

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  purchase_in: "مشتريات وارد",
  return_in: "مرتجع مشتريات",
  adjustment_in: "تسوية وارد",
  sale_out: "مبيعات صادر",
  return_out: "مرتجع مبيعات",
  adjustment_out: "تسوية صادر",
  transfer_in: "تحويل وارد",
  transfer_out: "تحويل صادر",
  damage: "تلف",
};

export const MOVEMENT_TYPE_COLORS: Record<MovementType, string> = {
  purchase_in: "text-green-500",
  return_in: "text-blue-500",
  adjustment_in: "text-teal-500",
  sale_out: "text-red-500",
  return_out: "text-amber-500",
  adjustment_out: "text-orange-500",
  transfer_in: "text-cyan-500",
  transfer_out: "text-purple-500",
  damage: "text-rose-500",
};

export const INBOUND_TYPES: MovementType[] = ["purchase_in", "return_in", "adjustment_in", "transfer_in"];
export const OUTBOUND_TYPES: MovementType[] = ["sale_out", "return_out", "adjustment_out", "transfer_out", "damage"];

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  warehouse: string;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  reorderLevel: number;
  expiryDate: string;
  notes: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: MovementType;
  quantity: number;
  unitCost: number;
  reference: string;
  notes: string;
  date: string;
  createdAt: string;
}

export interface InventoryCount {
  id: string;
  itemId: string;
  itemName: string;
  warehouse: string;
  expectedQty: number;
  actualQty: number;
  difference: number;
  notes: string;
  date: string;
  createdAt: string;
}

export interface InventoryTransfer {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  fromWarehouse: string;
  toWarehouse: string;
  reference: string;
  notes: string;
  date: string;
  createdAt: string;
}
