export interface RoomType {
  id: string;
  name: string;
  description: string;
  maxGuests: number;
  amenities: string[];
}

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  typeId: string;
  status: RoomStatus;
  notes: string;
}

export type RoomStatus = "available" | "occupied" | "maintenance" | "reserved";

export interface SeasonPrice {
  id: string;
  roomTypeId: string;
  seasonName: string;
  price: number;
}

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  available: "متاحة",
  occupied: "مشغولة",
  maintenance: "صيانة",
  reserved: "محجوزة",
};

export const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  available: "text-green-500 bg-green-500/10",
  occupied: "text-red-500 bg-red-500/10",
  maintenance: "text-amber-500 bg-amber-500/10",
  reserved: "text-blue-500 bg-blue-500/10",
};

export type ReservationStatus = "active" | "checked-in" | "completed" | "cancelled";

export interface Reservation {
  id: string;
  guestName: string;
  guestPhone: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  notes: string;
  totalAmount: number;
  createdAt: string;
}

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  active: "نشط",
  "checked-in": "تم الدخول",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  active: "text-blue-500 bg-blue-500/10",
  "checked-in": "text-green-500 bg-green-500/10",
  completed: "text-slate-500 bg-slate-500/10",
  cancelled: "text-red-500 bg-red-500/10",
};

export type ServiceType = "room-service" | "laundry" | "restaurant" | "additional";

export interface ServiceRequest {
  id: string;
  serviceType: ServiceType;
  guestName: string;
  roomNumber: string;
  item: string;
  quantity: number;
  amount: number;
  status: "pending" | "completed" | "cancelled";
  notes: string;
  createdAt: string;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  "room-service": "خدمة الغرف",
  laundry: "المغسلة",
  restaurant: "المطعم",
  additional: "خدمات إضافية",
};

export const SERVICE_STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export const SERVICE_STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-500 bg-amber-500/10",
  completed: "text-green-500 bg-green-500/10",
  cancelled: "text-red-500 bg-red-500/10",
};

export type InvoiceType = "stay" | "expense" | "payment";

export interface Invoice {
  id: string;
  invoiceType: InvoiceType;
  guestName: string;
  roomNumber: string;
  reservationId?: string;
  description: string;
  amount: number;
  status: "pending" | "paid" | "cancelled" | "refunded";
  date: string;
  notes: string;
  createdAt: string;
}

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  stay: "إقامة",
  expense: "مصروفات",
  payment: "سداد",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  pending: "غير مسدد",
  paid: "مسدد",
  cancelled: "ملغي",
  refunded: "مردود",
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-500 bg-amber-500/10",
  paid: "text-green-500 bg-green-500/10",
  cancelled: "text-red-500 bg-red-500/10",
  refunded: "text-purple-500 bg-purple-500/10",
};
