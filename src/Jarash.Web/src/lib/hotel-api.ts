import { apiRequest } from "./api";
import type {
  RoomType, Room, SeasonPrice,
  Reservation, Invoice, ServiceRequest,
} from "../pages/hotel/hotelTypes";

const BASE = "/hotel";

async function extractData<T>(res: Response): Promise<T> {
  if (res.status === 204 || res.headers.get("content-length") === "0") return {} as T;
  return res.json();
}

export const hotelApi = {
  // Room Types
  getRoomTypes: () => apiRequest<RoomType[]>(`${BASE}/room-types`),
  createRoomType: (data: Omit<RoomType, "id">) =>
    apiRequest<RoomType>(`${BASE}/room-types`, { method: "POST", body: JSON.stringify(data) }),
  updateRoomType: (id: string, data: Partial<RoomType>) =>
    apiRequest<RoomType>(`${BASE}/room-types/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRoomType: (id: string) =>
    apiRequest<void>(`${BASE}/room-types/${id}`, { method: "DELETE" }),

  // Rooms
  getRooms: () => apiRequest<Room[]>(`${BASE}/rooms`),
  createRoom: (data: Omit<Room, "id">) =>
    apiRequest<Room>(`${BASE}/rooms`, { method: "POST", body: JSON.stringify(data) }),
  updateRoom: (id: string, data: Partial<Room>) =>
    apiRequest<Room>(`${BASE}/rooms/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRoom: (id: string) =>
    apiRequest<void>(`${BASE}/rooms/${id}`, { method: "DELETE" }),

  // Season Prices
  getPrices: () => apiRequest<SeasonPrice[]>(`${BASE}/prices`),
  getPricesByType: (roomTypeId: string) =>
    apiRequest<SeasonPrice[]>(`${BASE}/prices/by-type/${roomTypeId}`),
  upsertPrice: (data: Omit<SeasonPrice, "id"> & { id?: string }) =>
    apiRequest<SeasonPrice>(`${BASE}/prices`, { method: "POST", body: JSON.stringify(data) }),
  deletePrice: (id: string) =>
    apiRequest<void>(`${BASE}/prices/${id}`, { method: "DELETE" }),

  // Reservations
  getReservations: () => apiRequest<Reservation[]>(`${BASE}/reservations`),
  getReservationById: (id: string) => apiRequest<Reservation>(`${BASE}/reservations/${id}`),
  getActiveReservations: () => apiRequest<Reservation[]>(`${BASE}/reservations/active`),
  createReservation: (data: Omit<Reservation, "id" | "createdAt">) =>
    apiRequest<Reservation>(`${BASE}/reservations`, { method: "POST", body: JSON.stringify(data) }),
  updateReservation: (id: string, data: Partial<Reservation>) =>
    apiRequest<Reservation>(`${BASE}/reservations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  cancelReservation: (id: string) =>
    apiRequest<void>(`${BASE}/reservations/${id}/cancel`, { method: "PATCH" }),
  extendStay: (id: string, newCheckOut: string) =>
    apiRequest<void>(`${BASE}/reservations/${id}/extend`, { method: "PATCH", body: JSON.stringify({ newCheckOut }) }),

  // Invoices
  getInvoices: () => apiRequest<Invoice[]>(`${BASE}/invoices`),
  getInvoicesByType: (invoiceType: string) =>
    apiRequest<Invoice[]>(`${BASE}/invoices/by-type/${invoiceType}`),
  createInvoice: (data: Omit<Invoice, "id" | "createdAt">) =>
    apiRequest<Invoice>(`${BASE}/invoices`, { method: "POST", body: JSON.stringify(data) }),
  updateInvoice: (id: string, data: Partial<Invoice>) =>
    apiRequest<Invoice>(`${BASE}/invoices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteInvoice: (id: string) =>
    apiRequest<void>(`${BASE}/invoices/${id}`, { method: "DELETE" }),

  // Service Requests
  getServiceRequests: () => apiRequest<ServiceRequest[]>(`${BASE}/service-requests`),
  getServiceRequestsByType: (serviceType: string) =>
    apiRequest<ServiceRequest[]>(`${BASE}/service-requests/by-type/${serviceType}`),
  createServiceRequest: (data: Omit<ServiceRequest, "id" | "createdAt">) =>
    apiRequest<ServiceRequest>(`${BASE}/service-requests`, { method: "POST", body: JSON.stringify(data) }),
  updateServiceRequest: (id: string, data: Partial<ServiceRequest>) =>
    apiRequest<ServiceRequest>(`${BASE}/service-requests/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteServiceRequest: (id: string) =>
    apiRequest<void>(`${BASE}/service-requests/${id}`, { method: "DELETE" }),
  completeServiceRequest: (id: string) =>
    apiRequest<void>(`${BASE}/service-requests/${id}/complete`, { method: "PATCH" }),
};
