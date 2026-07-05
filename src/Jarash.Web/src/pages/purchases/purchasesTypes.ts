export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  notes: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type PurchaseOrderStatus = "pending" | "approved" | "completed" | "cancelled";

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  pending: "معلق",
  approved: "معتمد",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export const PURCHASE_ORDER_STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  pending: "text-amber-500 bg-amber-500/10",
  approved: "text-green-500 bg-green-500/10",
  completed: "text-blue-500 bg-blue-500/10",
  cancelled: "text-red-500 bg-red-500/10",
};

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: PurchaseOrderStatus;
  notes: string;
  createdAt: string;
}

export interface PurchaseInvoiceItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type PurchaseInvoiceStatus = "pending" | "paid" | "cancelled" | "returned";

export const PURCHASE_INVOICE_STATUS_LABELS: Record<PurchaseInvoiceStatus, string> = {
  pending: "غير مسددة",
  paid: "مسددة",
  cancelled: "ملغية",
  returned: "مرتجع",
};

export const PURCHASE_INVOICE_STATUS_COLORS: Record<PurchaseInvoiceStatus, string> = {
  pending: "text-amber-500 bg-amber-500/10",
  paid: "text-green-500 bg-green-500/10",
  cancelled: "text-red-500 bg-red-500/10",
  returned: "text-purple-500 bg-purple-500/10",
};

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseInvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  status: PurchaseInvoiceStatus;
  notes: string;
  createdAt: string;
}

export interface PurchaseReturnItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  invoiceId: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseReturnItem[];
  totalAmount: number;
  notes: string;
  createdAt: string;
}

export type PaymentType = "payment" | "voucher" | "settlement";

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  payment: "دفعة مورد",
  voucher: "سند صرف",
  settlement: "تسوية",
};

export const PAYMENT_TYPE_COLORS: Record<PaymentType, string> = {
  payment: "text-blue-500 bg-blue-500/10",
  voucher: "text-amber-500 bg-amber-500/10",
  settlement: "text-green-500 bg-green-500/10",
};

export interface SupplierPayment {
  id: string;
  type: PaymentType;
  supplierId: string;
  supplierName: string;
  amount: number;
  date: string;
  reference: string;
  notes: string;
  createdAt: string;
}
